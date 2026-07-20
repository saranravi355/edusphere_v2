"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { BookCheck, Sparkles, AlertCircle } from "lucide-react";

const coverage = [
  { subject: "Mathematics: Analysis & Approaches HL (Group 5)", grade: "DP2", pacing: 78, target: 85, status: "behind" },
  { subject: "Biology SL (Group 4)", grade: "DP1", pacing: 91, target: 80, status: "ahead" },
  { subject: "Individuals & Societies — History (Group 3)", grade: "MYP4", pacing: 83, target: 82, status: "on-track" },
  { subject: "English A: Literature HL (Group 1)", grade: "DP2", pacing: 70, target: 88, status: "behind" },
  { subject: "Language Acquisition — French B (Group 2)", grade: "MYP3", pacing: 86, target: 84, status: "on-track" },
];

const statusStyles: Record<string, string> = {
  behind: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ahead: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "on-track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function CurriculumCoveragePage() {
  const { running, complete, run } = useAIScan(2400);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Curriculum Coverage Tracker"
        description="Compares each subject's actual unit-plan progress against the IB pacing guide for DP and MYP, flagging classes that risk not completing syllabus before assessment windows."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BookCheck size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-emerald-300" /> Pacing Analyzer</h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">
            Cross-checks lesson logs and unit-plan checkpoints against the term&apos;s IB pacing guide for every DP and MYP subject.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><BookCheck size={18} className="animate-pulse" /> Checking Pacing...</> : <><BookCheck size={18} /> Run Coverage Check</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {coverage.map((c, i) => (
            <div key={i} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{c.subject}</p>
                <p className="text-xs text-slate-500">{c.grade} · Pacing {c.pacing}% vs target {c.target}%</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 shrink-0 ${statusStyles[c.status]}`}>
                {c.status === "behind" && <AlertCircle size={12} />} {c.status.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={BookCheck} title="No Coverage Data" subtitle="Run the check to compare actual pacing against the IB syllabus guide." />
      )}
    </div>
  );
}
