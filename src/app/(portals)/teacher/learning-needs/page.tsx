import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { HeartHandshake, Target, CheckCircle2, CalendarClock, UserCheck } from "lucide-react";
import GoalProgressButton from "./GoalProgressButton";

export const dynamic = "force-dynamic";

export default async function TeacherLearningNeedsPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: { select: { id: true } } },
  });

  const classIds = teacher?.classes.map((c) => c.id) || [];

  // Plans for students in my classes, or where I am the case manager
  const plans = await prisma.iEPPlan.findMany({
    where: {
      status: { not: "ARCHIVED" },
      OR: [
        { student: { classroomId: { in: classIds } } },
        ...(teacher ? [{ caseManagerId: teacher.id }] : []),
      ],
    },
    include: {
      student: { include: { classroom: true } },
      caseManager: { include: { user: true } },
      goals: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myCaseload = teacher ? plans.filter((p) => p.caseManagerId === teacher.id).length : 0;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Learning Needs & IEP"
        description="IEP students in your classes — accommodations to apply and goals you can update after each lesson."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            <HeartHandshake size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{plans.length}</p>
            <p className="text-xs text-slate-500">IEP students you teach</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{myCaseload}</p>
            <p className="text-xs text-slate-500">On your caseload</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "ACHIEVED").length, 0)}
            </p>
            <p className="text-xs text-slate-500">Goals achieved</p>
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          <HeartHandshake className="mx-auto mb-3 text-slate-400" size={32} />
          No IEP students in your classes right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{plan.student.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {plan.student.classroom?.name || "Unassigned"} &middot; {plan.needType}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                  {plan.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">{plan.summary}</p>

              {plan.accommodations && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">Apply in your classroom</span>
                  {plan.accommodations}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck size={13} />
                  {plan.caseManager?.user?.name || "No case manager"}
                </span>
                {plan.reviewDate && (
                  <span className="flex items-center gap-1">
                    <CalendarClock size={13} />
                    Review {new Date(plan.reviewDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                {plan.goals.length === 0 && (
                  <p className="text-xs text-slate-400">No goals set yet — the SEN coordinator will add them.</p>
                )}
                {plan.goals.map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        {goal.status === "ACHIEVED" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <Target size={14} className="text-blue-500" />
                        )}
                        {goal.title}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{goal.progress}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${goal.status === "ACHIEVED" ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      {goal.status !== "ACHIEVED" && (
                        <GoalProgressButton goalId={goal.id} progress={goal.progress} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
