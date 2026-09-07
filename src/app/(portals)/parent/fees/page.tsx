import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CheckCircle2, Clock, AlertCircle, Info, ReceiptText } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { methodLabel, receiptNo, settlingPayment } from "@/lib/fees";

export default async function ParentFeesPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { include: { classroom: true } } }
  });

  const studentIds = parent?.students.map(s => s.id) || [];

  const invoices = await prisma.feeInvoice.findMany({
    where: { studentId: { in: studentIds } },
    // The payment is what makes "PAID" mean anything: when, how, and a
    // reference to quote. The rows have always been here; nothing read them.
    include: { student: true, transactions: true },
    orderBy: { dueDate: 'asc' }
  });

  const paidTotal = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);
  const outstandingTotal = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  // Applicable fee structure for the child's grade band (from the loaded fee items).
  const gradeLevel = parent?.students[0]?.classroom?.gradeLevel ?? 0;
  const band = gradeLevel <= 5 ? "1-5" : gradeLevel <= 8 ? "6-8" : gradeLevel === 9 ? "9" : gradeLevel >= 10 ? "10" : "General";
  const feeItems = await prisma.feeItem.findMany({
    where: { gradeBand: { in: [band, "General"] } },
    orderBy: [{ gradeBand: "asc" }, { createdAt: "asc" }],
  });
  const bandItems = feeItems.filter((i) => i.gradeBand === band);
  const optionalItems = feeItems.filter((i) => i.gradeBand === "General");
  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  const bandTotal = bandItems.filter((i) => i.mandatory).reduce((sum, i) => sum + i.amount * i.installments, 0);
  const bandLabel: Record<string, string> = { "1-5": "Grade 1 – 5", "6-8": "Grade 6 – 8", "9": "Grade 9", "10": "Grade 10 & above", "General": "General" };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    PAID: { label: "Paid", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
    PENDING: { label: "Pending", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: Clock },
    OVERDUE: { label: "Overdue", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Fee Payments"
        description="View invoices and pay outstanding fees for your children."
      />

      {bandItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-heading text-base text-slate-800 dark:text-slate-100">Fee structure &mdash; {bandLabel[band] ?? band}</h3>
              <p className="text-xs text-slate-500">Academic year {feeItems[0]?.academicYear ?? "2025-26"} &middot; amounts shown per term</p>
            </div>
            <span className="text-sm text-slate-500">Mandatory annual: <span className="font-semibold text-slate-800 dark:text-slate-100">{inr(bandTotal)}</span></span>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500">
              <th className="py-2.5 px-6">Category</th>
              <th className="py-2.5 px-6 text-right">Per term</th>
              <th className="py-2.5 px-6 text-center">Terms</th>
              <th className="py-2.5 px-6 text-right">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bandItems.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5 px-6 text-slate-700 dark:text-slate-200">{it.category}{!it.mandatory && <span className="ml-2 text-[10px] text-slate-400">(optional)</span>}</td>
                  <td className="py-2.5 px-6 text-right text-slate-700 dark:text-slate-200">{inr(it.amount)}</td>
                  <td className="py-2.5 px-6 text-center text-slate-400">&times; {it.installments}</td>
                  <td className="py-2.5 px-6 text-right font-semibold text-slate-800 dark:text-slate-100">{inr(it.amount * it.installments)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {optionalItems.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              Optional add-ons available: {optionalItems.map((i) => i.category).join(", ")}.
            </div>
          )}
        </div>
      )}

      {/* What has actually been paid, which the page could not say before. */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4">
            <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400/70">Paid to date</p>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">{inr(paidTotal)}</p>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/60 mt-0.5">
              across {invoices.filter((i) => i.status === "PAID").length} invoice
              {invoices.filter((i) => i.status === "PAID").length === 1 ? "" : "s"}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${outstandingTotal > 0
            ? "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20"
            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"}`}>
            <p className={`text-xs font-semibold ${outstandingTotal > 0 ? "text-amber-800/70 dark:text-amber-400/70" : "text-slate-500"}`}>Outstanding</p>
            <p className={`text-2xl font-bold tabular-nums ${outstandingTotal > 0 ? "text-amber-800 dark:text-amber-300" : "text-slate-500"}`}>{inr(outstandingTotal)}</p>
            <p className={`text-[11px] mt-0.5 ${outstandingTotal > 0 ? "text-amber-700/70 dark:text-amber-400/60" : "text-slate-400"}`}>
              {outstandingTotal > 0 ? "payable at the school office" : "nothing due"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-6">Student</th>
              <th className="py-3 px-6">Description</th>
              <th className="py-3 px-6">Due Date</th>
              <th className="py-3 px-6 text-right">Amount</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-right">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.map((invoice) => {
              const config = statusConfig[invoice.status] || statusConfig.PENDING;
              const Icon = config.icon;
              const payment = settlingPayment(invoice.transactions);
              return (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">{invoice.student.name}</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{invoice.title}</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{new Date(invoice.dueDate).toLocaleDateString('en-GB', { timeZone: "Asia/Kolkata" })}</td>
                  <td className="py-4 px-6 text-right font-bold text-slate-800 dark:text-slate-200">₹{invoice.amount.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                      <Icon size={12} /> {config.label}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {invoice.status === 'PAID' ? (
                      payment ? (
                        <div className="text-xs leading-relaxed">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(payment.createdAt, "dMonYyyy")} &middot; {methodLabel(payment.method)}
                          </p>
                          <p className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                            <ReceiptText size={11} aria-hidden /> {receiptNo(payment.id)}
                          </p>
                        </div>
                      ) : (
                        /* Marked paid with no payment recorded against it. Say so
                           rather than inventing a date — it is the office's cue
                           that something was settled outside the system. */
                        <span className="text-xs text-slate-400">Paid &middot; no record of how</span>
                      )
                    ) : (
                      /*
                       * Online payment is not implemented — there is no gateway
                       * integrated (see MIGRATION/PRD gap list). This previously
                       * rendered a "Pay Now" button whose server action simply set
                       * status = PAID, so a parent could clear their own fees
                       * without paying anything. That is removed: recording a
                       * payment is an authorised office action, not a self-service
                       * one. Until a gateway exists, tell the parent how to pay.
                       */
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Info size={12} aria-hidden />
                        Pay at the school office
                      </span>
                    )}
                    </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">No fee invoices found.</td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
