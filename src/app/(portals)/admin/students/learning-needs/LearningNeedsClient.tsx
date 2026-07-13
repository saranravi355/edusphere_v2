"use client";

import { useState, useTransition } from "react";
import {
  HeartHandshake, Plus, Target, CalendarClock, X, CheckCircle2,
  AlertTriangle, Archive, RefreshCw, UserCheck,
} from "lucide-react";
import { createIEPPlan, addIEPGoal, updateGoalProgress, updatePlanStatus } from "./actions";

interface Goal {
  id: string;
  title: string;
  targetDate: string | null;
  progress: number;
  status: string;
}

interface Plan {
  id: string;
  needType: string;
  status: string;
  summary: string;
  accommodations: string | null;
  reviewDate: string | null;
  student: { id: string; name: string; classroom: { name: string } | null };
  caseManager: { id: string; user: { name: string | null } | null } | null;
  goals: Goal[];
}

const NEED_TYPES = [
  "Dyslexia", "Dyscalculia", "ADHD", "Autism Spectrum", "Speech & Language",
  "Hearing Impairment", "Visual Impairment", "Gifted & Talented", "EAL Support", "Social-Emotional",
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400",
};

export default function LearningNeedsClient({
  plans,
  students,
  teachers,
}: {
  plans: Plan[];
  students: { id: string; name: string; registrationNo: string }[];
  teachers: { id: string; name: string }[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [goalPlanId, setGoalPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = plans.filter((p) => p.status === "ACTIVE").length;
  const review = plans.filter((p) => p.status === "UNDER_REVIEW").length;
  const goalCount = plans.reduce((n, p) => n + p.goals.length, 0);
  const achieved = plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "ACHIEVED").length, 0);

  const stats = [
    { label: "Active Plans", value: active, icon: HeartHandshake, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Under Review", value: review, icon: RefreshCw, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "Goals Tracked", value: goalCount, icon: Target, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
    { label: "Goals Achieved", value: achieved, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ];

  function submitPlan(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createIEPPlan(formData);
      if (res?.error) setError(res.error);
      else setShowForm(false);
    });
  }

  function submitGoal(formData: FormData) {
    startTransition(async () => {
      await addIEPGoal(formData);
      setGoalPlanId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} /> New IEP Plan
        </button>
      </div>

      {/* Plan cards */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          <HeartHandshake className="mx-auto mb-3 text-slate-400" size={32} />
          No IEP plans yet. Create the first one to start tracking learning support.
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
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[plan.status] || STATUS_STYLES.ARCHIVED}`}>
                  {plan.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">{plan.summary}</p>

              {plan.accommodations && (
                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Accommodations</span>
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

              {/* Goals */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                {plan.goals.map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        {goal.status === "ACHIEVED" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : goal.status === "AT_RISK" ? (
                          <AlertTriangle size={14} className="text-red-500" />
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
                          className={`h-full rounded-full transition-all ${goal.status === "ACHIEVED" ? "bg-emerald-500" : "bg-blue-500"}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      {goal.status !== "ACHIEVED" && (
                        <button
                          onClick={() => startTransition(() => updateGoalProgress(goal.id, goal.progress + 10).then(() => {}))}
                          disabled={isPending}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap disabled:opacity-50"
                        >
                          +10%
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {goalPlanId === plan.id ? (
                  <form action={submitGoal} className="flex gap-2 items-center pt-1">
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      name="title"
                      required
                      autoFocus
                      placeholder="Goal title, e.g. Reads 90 wpm with 95% accuracy"
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      name="targetDate"
                      className="px-2 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                    />
                    <button type="submit" disabled={isPending} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                      Add
                    </button>
                    <button type="button" onClick={() => setGoalPlanId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setGoalPlanId(plan.id)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add goal
                    </button>
                    <div className="flex gap-2">
                      {plan.status === "ACTIVE" && (
                        <button
                          onClick={() => startTransition(() => updatePlanStatus(plan.id, "UNDER_REVIEW").then(() => {}))}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> Mark for review
                        </button>
                      )}
                      {plan.status !== "ARCHIVED" && (
                        <button
                          onClick={() => startTransition(() => updatePlanStatus(plan.id, "ARCHIVED").then(() => {}))}
                          className="text-xs text-slate-400 hover:underline flex items-center gap-1"
                        >
                          <Archive size={12} /> Archive
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create plan modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">New IEP Plan</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">{error}</div>
            )}

            <form action={submitPlan} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Student</label>
                <select name="studentId" required className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.registrationNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Need Type</label>
                  <select name="needType" required className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                    {NEED_TYPES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Case Manager</label>
                  <select name="caseManagerId" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Summary of Needs</label>
                <textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="Brief profile of the student's learning needs and strengths…"
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Accommodations (one per line)</label>
                <textarea
                  name="accommodations"
                  rows={3}
                  placeholder={"Extra time on assessments\nPreferential seating\nText-to-speech tools"}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Next Review Date</label>
                <input type="date" name="reviewDate" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating…" : "Create IEP Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
