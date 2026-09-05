import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CheckCircle2, XCircle, Clock, UserCheck } from "lucide-react";
import { SubmitButton } from "@/components/ui/form";
import { decideLeave } from "@/app/(portals)/teacher/leave/actions";
import { leaveTypeLabel, workingDaysBetween } from "@/lib/leave";
import { formatDate } from "@/lib/dates";
import AIFeatureLink from "@/components/ai/AIFeatureLink";

export const dynamic = "force-dynamic";

export default async function StaffLeavePage() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }

  // Pending first — this is a queue, and a decision that has already been made
  // does not need to be at the top of it.
  const leaveRequests = await prisma.leaveRequest.findMany({
    select: {
      id: true, status: true, reason: true, leaveType: true,
      startDate: true, endDate: true, appliedAt: true, decidedAt: true,
      teacher: { select: { user: { select: { name: true } } } },
      substituteTeacher: { select: { user: { select: { name: true } } } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });
  const pendingFirst = [
    ...leaveRequests.filter((r) => r.status === "PENDING"),
    ...leaveRequests.filter((r) => r.status !== "PENDING"),
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
    APPROVED: { label: "Approved", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    REJECTED: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Staff Leave Management"
        description="Review and approve teacher leave requests."
      />

      <AIFeatureLink
        href="/admin/ai-insights/substitute-recommender"
        icon={<UserCheck size={15} />}
        title="Substitute Recommender"
        description="Suggests the best-fit cover teacher for an open period."
      />

      <div className="space-y-4">
        {pendingFirst.map((req) => {
          const config = statusConfig[req.status] || statusConfig.PENDING;
          return (
            <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{req.teacher.user.name}</p>
                  <p className="text-sm text-slate-500">
                    {leaveTypeLabel(req.leaveType)} · {formatDate(req.startDate, "dMon")} – {formatDate(req.endDate, "dMon")}
                    {" · "}{workingDaysBetween(req.startDate, req.endDate)} working day
                    {workingDaysBetween(req.startDate, req.endDate) === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <UserCheck size={12} aria-hidden />
                    Cover: {req.substituteTeacher?.user.name ?? "no preference given"}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">&quot;{req.reason}&quot;</p>
              {req.decidedAt && (
                <p className="text-xs text-slate-400 mb-3">Decided {formatDate(req.decidedAt, "dMonYy")}.</p>
              )}

              {req.status === 'PENDING' && (
                <div className="flex gap-3">
                  <form action={async () => { "use server"; await decideLeave(req.id, "APPROVED"); }}>
                    <SubmitButton size="sm" pendingText="Approving…" className="bg-green-600 hover:bg-green-700 text-white font-bold">
                      <CheckCircle2 size={12} aria-hidden /> Approve
                    </SubmitButton>
                  </form>
                  <form action={async () => { "use server"; await decideLeave(req.id, "REJECTED"); }}>
                    <SubmitButton size="sm" pendingText="Rejecting…" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                      <XCircle size={12} aria-hidden /> Reject
                    </SubmitButton>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {pendingFirst.length === 0 && (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
            <Clock size={32} />
            <p>No leave requests submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
