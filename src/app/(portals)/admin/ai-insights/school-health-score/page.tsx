"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import ScoreGauge from "@/components/ai/ScoreGauge";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { HeartPulse, Sparkles } from "lucide-react";

const pillars = [
  { label: "Academic Performance (DP/MYP)", score: 81 },
  { label: "Attendance & Engagement", score: 88 },
  { label: "Staff Wellbeing & Retention", score: 69 },
  { label: "Financial Health", score: 92 },
  { label: "Parent Satisfaction", score: 76 },
];

export default function SchoolHealthScorePage() {
  const { running, complete, run } = useAIScan(2600);
  const overall = Math.round(pillars.reduce((a, p) => a + p.score, 0) / pillars.length);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="School Health Score"
        description="A single composite KPI blending academics, attendance, staff wellbeing, finance and parent sentiment into one trackable index for leadership."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><HeartPulse size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-indigo-300" /> Composite Health Engine</h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-lg leading-relaxed">
            Aggregates five weighted pillars across the school into a single 0–100 health score, refreshed termly for the leadership dashboard.
          </p>
          <button
            onClick={run}
            disabled={running}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {running ? <><HeartPulse size={18} className="animate-pulse" /> Computing Score...</> : <><HeartPulse size={18} /> Compute School Health Score</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center mb-8">
            <ScoreGauge score={overall} label="Overall School Health" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{p.label}</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{p.score}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.score >= 80 ? "bg-emerald-500" : p.score >= 65 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AIEmptyState icon={HeartPulse} title="No Score Yet" subtitle="Compute the score to see this term's composite school health index." />
      )}
    </div>
  );
}
