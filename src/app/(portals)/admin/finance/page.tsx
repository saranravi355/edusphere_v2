import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Receipt, IndianRupee, LineChart, Wallet, ArrowRight } from "lucide-react";

export default async function FinanceHubPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/');

  const [pendingInvoices, paidInvoices] = await Promise.all([
    prisma.feeInvoice.findMany({ where: { status: 'PENDING' } }),
    prisma.feeInvoice.findMany({ where: { status: 'PAID' } }),
  ]);

  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const collectedTotal = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

  const sections = [
    {
      title: "Invoices",
      description: "Generate and track term fee invoices for every student.",
      href: "/admin/finance/invoices",
      icon: Receipt,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Payroll",
      description: "Run automated monthly payroll batches for staff.",
      href: "/admin/finance/payroll",
      icon: IndianRupee,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "AI Cash Flow Forecast",
      description: "Project inflow vs. outflow over the next 6 months.",
      href: "/admin/finance/cashflow-forecast",
      icon: LineChart,
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
      title: "Payment Predictor",
      description: "Flag families likely to pay late on the next due date.",
      href: "/admin/finance/payment-predictor",
      icon: Wallet,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Finance"
        description="Invoicing, payroll, and AI-powered financial forecasting."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Outstanding Fees</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{pendingTotal.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1">{pendingInvoices.length} pending invoice(s)</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Collected This Term</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{collectedTotal.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1">{paidInvoices.length} paid invoice(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <div className="h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{s.description}</p>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
