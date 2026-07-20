"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { CalendarRange, Sparkles, CheckCircle2 } from "lucide-react";

const plan = [
  { day: "Mon", focus: "Mathematics AA — Differentiation practice set", duration: "40 min" },
  { day: "Tue", focus: "Chemistry SL — IA data analysis draft", duration: "50 min" },
  { day: "Wed", focus: "English A — Comparative essay outline", duration: "35 min" },
  { day: "Thu", focus: "TOK — Prepare exhibition commentary notes", duration: "30 min" },
  { day: "Fri", focus: "CAS — Log reflection for this week's activity", duration: "15 min" },
  { day: "Sat", focus: "Mathematics AA — Review formative mistakes", duration: "30 min" },
];

export default function StudyPlanPage() {
  const { running, complete, run } = useAIScan(2400);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="AI Study Plan Generator"
        description="Builds a personalized weekly study schedule from your timetable, upcoming IA/EE deadlines, and learning-gap map."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-sky-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><CalendarRange size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-sky-300" /> Plan Builder</h2>
          <p className="text-sky-200 text-sm mb-6 max-w-lg leading-relaxed">
            Balances time across subjects based on your weakest topics, upcoming deadlines, and free periods this week.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><CalendarRange size={18} className="animate-pulse" /> Building Your Plan...</> : <><CalendarRange size={18} /> Generate This Week&apos;s Plan</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {plan.map((p, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <span className="w-12 text-sm font-bold text-slate-400 shrink-0">{p.day}</span>
              <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{p.focus}</span>
              <span className="text-xs text-slate-400 shrink-0">{p.duration}</span>
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={CalendarRange} title="No Plan Yet" subtitle="Generate your personalized study plan for this week." />
      )}
    </div>
  );
}
