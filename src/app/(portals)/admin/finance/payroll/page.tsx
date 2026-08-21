import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExportButton from "@/components/data/ExportButton";
import PayrollControls from "./PayrollControls";
import { IndianRupee, CheckCircle2, Plane, Users } from "lucide-react";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** Last twelve months, newest first, as yyyy-mm. */
function recentPeriods(count = 12): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

const monthLabel = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`;
};

/**
 * Payroll.
 *
 * The cycle dropdown had no name, no value and no handler, and the ledger below
 * it was headed "Jun 2026" whatever it said. "Run Payroll Batch" was a
 * 2.5-second setTimeout, after which three hardcoded staff rows appeared and a
 * hardcoded "₹2,45,600 across 85 Staff Members" — at a school with 15 teachers.
 * "Disburse Funds" and "Export CSV" had no onClick at all, so money was never
 * moved or recorded, and a banner claimed the page was "Syncing with Leave
 * Module to calculate UTO deductions" while never reading it.
 *
 * Runs and lines are stored, the month selector works, unpaid leave is read
 * from the leave module for real, and disbursement is recorded.
 */
export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const periods = recentPeriods();
  const sp = await searchParams;
  const period = periods.includes(sp.period ?? "") ? sp.period! : periods[0];

  const [run, teachers] = await Promise.all([
    prisma.payrollRun.findUnique({
      where: { period },
      include: {
        lines: {
          include: { teacher: { select: { user: { select: { name: true } }, subjects: true } } },
          orderBy: { netPay: "desc" },
        },
      },
    }),
    prisma.teacher.findMany({
      select: { id: true, baseSalary: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const status: "NONE" | "DRAFT" | "DISBURSED" = !run ? "NONE" : run.status === "DISBURSED" ? "DISBURSED" : "DRAFT";
  const lines = run?.lines ?? [];
  const totalDeductions = lines.reduce((n, l) => n + l.deductions, 0);

  const exportRows = lines.map((l) => ({
    Period: period,
    Staff: l.teacher.user.name,
    Subjects: l.teacher.subjects,
    BaseSalary: l.baseSalary,
    UnpaidDays: l.unpaidDays,
    Deductions: l.deductions,
    NetPay: l.netPay,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Payroll"
        description="Monthly salary runs, with unpaid leave read from the leave module."
        action={<ExportButton rows={exportRows} filename={`payroll-${period}`} label="Export run" />}
      />

      {/* The cycle selector, as a real GET form. */}
      <form className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pr-period">Payroll cycle</label>
          <select
            id="pr-period"
            name="period"
            defaultValue={period}
            className="p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium text-slate-700 dark:text-slate-300 text-sm"
          >
            {periods.map((p) => <option key={p} value={p}>{monthLabel(p)}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold">
          Open
        </button>
        <Link href="/admin/staff/leave" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline py-2.5">
          Leave approvals
        </Link>
      </form>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{monthLabel(period)}</h3>
            <p className="text-sm text-slate-500">
              {status === "NONE" && "Not calculated yet."}
              {status === "DRAFT" && `Draft · ${lines.length} staff · recalculating replaces it.`}
              {status === "DISBURSED" && run?.disbursedAt && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} aria-hidden /> Disbursed {formatDate(run.disbursedAt, "dMonYyyy")}
                </span>
              )}
            </p>
          </div>
        </div>

        <PayrollControls
          period={period}
          status={status}
          hasLines={lines.length > 0}
          teachers={teachers.map((t) => ({ id: t.id, name: t.user.name, baseSalary: t.baseSalary }))}
        />
      </div>

      {lines.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Net payable", value: `₹${(run?.totalNet ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee },
              { label: "Staff in this run", value: lines.length, icon: Users },
              { label: "Unpaid-leave deductions", value: `₹${totalDeductions.toLocaleString("en-IN")}`, icon: Plane },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                  <s.icon size={20} aria-hidden />
                </div>
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Salary ledger — {monthLabel(period)}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">Staff</th>
                    <th className="text-right font-medium px-5 py-2.5">Base</th>
                    <th className="text-right font-medium px-5 py-2.5">Unpaid days</th>
                    <th className="text-right font-medium px-5 py-2.5">Deductions</th>
                    <th className="text-right font-medium px-5 py-2.5">Net pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-5 py-2.5 text-slate-800 dark:text-slate-200">{l.teacher.user.name}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">₹{l.baseSalary.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">{l.unpaidDays || "—"}</td>
                      <td className={`px-5 py-2.5 text-right tabular-nums ${l.deductions > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                        {l.deductions > 0 ? `−₹${l.deductions.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">₹{l.netPay.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
