import PageHeader from "@/components/ui/PageHeader";
import ExportButton from "@/components/data/ExportButton";
import { Receipt, FileText, CheckCircle2, Clock, Send } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";

export default async function FeeInvoicesPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/');

  const feeStructures = await prisma.feeStructure.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const recentInvoices = await prisma.feeInvoice.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { student: true }
  });

  async function generateInvoices(formData: FormData) {
    "use server";
    // Bills every family in a cohort — strictly an admin action.
    const auth = await guard(ADMIN_ROLES);
    if (!auth.ok) redirect("/");
    const feeStructureId = formData.get("feeStructureId") as string;
    const dueDate = formData.get("dueDate") as string;
    
    if (!feeStructureId || !dueDate) return;

    const structure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
    if (!structure) return;

    // Which students does this plan cover? Prefer an explicit gradeLevel; the
    // seeded plans instead name the IB programme ("MYP Annual Tuition"), so fall
    // back to that. With neither, the plan is school-wide.
    const programme =
      structure.gradeLevel?.trim() ||
      ["PYP", "MYP", "DP"].find((p) => structure.name.toUpperCase().includes(p)) ||
      null;

    const students = await prisma.student.findMany({
      where: programme ? { curriculum: programme } : {},
      select: { id: true },
    });
    if (students.length === 0) return;

    const due = new Date(dueDate);
    const title = `${structure.name} (${structure.academicYear})`;

    // Idempotent: clicking twice must not bill a family twice.
    const already = await prisma.feeInvoice.findMany({
      where: { title, dueDate: due, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true },
    });
    const billed = new Set(already.map((a) => a.studentId));
    const toCreate = students.filter((s) => !billed.has(s.id));

    if (toCreate.length > 0) {
      await prisma.feeInvoice.createMany({
        data: toCreate.map((s) => ({
          studentId: s.id,
          title,
          amount: structure.amount,
          status: "PENDING",
          dueDate: due,
        })),
      });

      // The caption under this button has always promised that generating
      // invoices "will instantly notify all linked Parent accounts". Nothing
      // notified anybody. Now it does.
      const parents = await prisma.student.findMany({
        where: { id: { in: toCreate.map((s) => s.id) }, parentId: { not: null } },
        select: { name: true, parent: { select: { userId: true } } },
      });
      const notifications = parents
        .filter((p) => p.parent?.userId)
        .map((p) => ({
          userId: p.parent!.userId,
          title: "New fee invoice",
          message: `${title} for ${p.name}: ₹${structure.amount.toLocaleString("en-IN")}, due ${due.toISOString().slice(0, 10)}.`,
          type: "INFO",
        }));
      if (notifications.length) await prisma.notification.createMany({ data: notifications });
    }
    revalidatePath("/admin/finance/invoices");
    revalidatePath("/parent/fees");
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [collected, pending, overdue] = await Promise.all([
    prisma.feeInvoice.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: monthStart } } }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true }, where: { status: "PENDING", dueDate: { gte: now } } }),
    prisma.feeInvoice.aggregate({
      _sum: { amount: true },
      where: { OR: [{ status: "OVERDUE" }, { status: "PENDING", dueDate: { lt: now } }] },
    }),
  ]);
  const collectedThisMonth = collected._sum.amount ?? 0;
  const pendingTotal = pending._sum.amount ?? 0;
  const overdueTotal = overdue._sum.amount ?? 0;

  const exportRows = recentInvoices.map((inv) => ({ Student: inv.student.name, Title: inv.title, Amount: inv.amount, Status: inv.status, DueDate: inv.dueDate.toISOString().slice(0, 10), PaidAt: inv.paidAt ? inv.paidAt.toISOString().slice(0, 10) : "" }));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Fee Invoicing & Generation" 
        description="Generate, track, and send invoices to parents based on global fee plans."
        action={<ExportButton rows={exportRows} filename="fee-invoices" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Generate Invoice Module */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-lg">
                <Send size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Batch Generate</h3>
            </div>
            
            <form action={generateInvoices} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Fee Plan</label>
                <select required name="feeStructureId" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white">
                  <option value="">Choose a plan...</option>
                  {feeStructures.map(fee => (
                    <option key={fee.id} value={fee.id}>
                      {fee.name} - ₹{fee.amount.toLocaleString("en-IN")} ({fee.gradeLevel || 'Global'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input required type="date" name="dueDate" className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white" />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-md">
                  Generate & Send Invoices
                </button>
                <p className="text-xs text-center text-slate-500 mt-3">This will instantly notify all linked Parent accounts.</p>
              </div>
            </form>
          </div>
          
          {/*
            These three figures were literals — ₹1,42,500 collected, ₹45,000
            pending, ₹8,200 overdue — sitting next to a ledger of the real
            invoices. They are sums over FeeInvoice now.
          */}
          <div className="bg-primary rounded-2xl p-6 text-white shadow-sm">
            <h3 className="font-medium text-green-100 mb-1">Collected this month</h3>
            <p className="text-4xl font-extrabold">₹{collectedThisMonth.toLocaleString("en-IN")}</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
              <span>Pending: ₹{pendingTotal.toLocaleString("en-IN")}</span>
              <span className="text-red-200">Overdue: ₹{overdueTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Receipt size={18} className="text-slate-500" />
              Recent Ledger Entries
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium">Invoice ID</th>
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        INV-{inv.id.substring(0, 6).toUpperCase()}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {inv.student.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {inv.title || "Standard Fee"}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                      ₹{inv.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {inv.status === 'PAID' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Receipt className="mx-auto mb-2 opacity-20" size={32} />
                      No invoices have been generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
