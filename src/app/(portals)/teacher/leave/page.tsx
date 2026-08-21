import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import LeaveForm from "./LeaveForm";
import { withdrawLeave } from "./actions";
import { ConfirmIconButton } from "@/components/ui/form";
import { LEAVE_TYPES, leaveTypeLabel, workingDaysBetween, daysTakenByType } from "@/lib/leave";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Leave Management.
 *
 * Everything on this page used to be invented: three balance cards reading
 * 12/15, 8/10 and 4/5; a history table of three absences that never happened;
 * and a form whose submit handler called preventDefault() and showed
 * "Your leave request has been sent to the Principal for approval". The
 * LeaveRequest table existed the whole time and the Principal's queue reads it,
 * so the one thing the page never did was the thing it claimed to do.
 */
export default async function TeacherLeaveManagement() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) redirect("/teacher");

  const [requests, colleagues] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true, leaveType: true, startDate: true, endDate: true, reason: true,
        status: true, appliedAt: true, decidedAt: true,
        substituteTeacher: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startDate: "desc" },
    }),
    prisma.teacher.findMany({
      where: { id: { not: teacher.id } },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const taken = daysTakenByType(requests.filter((r) => r.startDate >= yearStart));

  const tone = {
    APPROVED: { chip: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", Icon: CheckCircle2 },
    PENDING: { chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", Icon: Clock },
    REJECTED: { chip: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", Icon: XCircle },
  } as const;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Leave Management"
        description="Request time off and track your leave balances."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LEAVE_TYPES.map((t) => {
            const used = taken[t.value] ?? 0;
            const left = t.entitlement === null ? null : Math.max(0, t.entitlement - used);
            return (
              <div key={t.value} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{t.label} ({t.short})</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {left ?? used}
                  {t.entitlement !== null && <span className="text-sm font-normal text-slate-500"> / {t.entitlement}</span>}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t.entitlement === null ? `${used} day${used === 1 ? "" : "s"} taken this year` : `${used} used this year`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <LeaveForm colleagues={colleagues.map((c) => ({ id: c.id, name: c.user.name }))} />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 px-1">
            Balances count working days only, and a pending request is already reserved against them.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Leave history</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Dates</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Substitute</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {requests.map((r) => {
                  const t = tone[r.status as keyof typeof tone] ?? tone.PENDING;
                  const days = workingDaysBetween(r.startDate, r.endDate);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 align-top">
                      <td className="p-4 text-sm font-medium">{leaveTypeLabel(r.leaveType)}</td>
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(r.startDate, "dMon")} – {formatDate(r.endDate, "dMon")}
                        <span className="block text-xs text-slate-400 max-w-[16rem] truncate" title={r.reason}>{r.reason}</span>
                      </td>
                      <td className="p-4 text-sm whitespace-nowrap">{days} day{days === 1 ? "" : "s"}</td>
                      <td className="p-4 text-sm text-slate-500">{r.substituteTeacher?.user.name ?? "No preference"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 w-max ${t.chip}`}>
                          <t.Icon size={12} aria-hidden /> {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                        {r.decidedAt && (
                          <span className="block text-[11px] text-slate-400 mt-1">{formatDate(r.decidedAt, "dMon")}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {r.status === "PENDING" && (
                          <ConfirmIconButton
                            onConfirm={async () => { "use server"; return withdrawLeave(r.id); }}
                            question="Withdraw this request?"
                            confirmLabel="Withdraw"
                            triggerLabel={`Withdraw leave from ${formatDate(r.startDate, "dMon")}`}
                            triggerClassName="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} aria-hidden />
                          </ConfirmIconButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-sm text-slate-500">
                      No leave requested yet. Your first request will appear here and in the Principal&apos;s queue.
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
