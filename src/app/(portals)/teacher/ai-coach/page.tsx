"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, GraduationCap, Lightbulb } from "lucide-react";

const nudges = [
  { title: "ATL Skill Gap: Self-Management", detail: "3 of your DP1 Chemistry students missed formative deadlines twice this unit. Consider a short ATL mini-lesson on time-management before the next IA checkpoint.", tag: "ATL" },
  { title: "Differentiation Opportunity", detail: "Your last unit's Criterion B scores show a 22-point spread. Two students may benefit from scaffolded worksheets in the next formative task.", tag: "Assessment" },
  { title: "CAS Supervision Reminder", detail: "Your CAS group's reflection log hasn't been updated in 3 weeks — IB requires regular reflection evidence for the CAS portfolio.", tag: "CAS" },
  { title: "Positive Trend", detail: "Engagement in your MYP4 Individuals & Societies class is up 14% since introducing inquiry-based starters — keep it up!", tag: "Praise" },
];

export default function AICoachPage() {
  const { running, complete, run } = useAIScan(2200);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="AI Coaching Nudges"
        description="Personalized, weekly teaching insights drawn from your gradebook, attendance and ATL/CAS records — built for IB pedagogy."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><GraduationCap size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-indigo-300" /> Weekly Coaching Engine</h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-lg leading-relaxed">
            Reviews your classes&apos; formative results, ATL skill ratings and CAS/IA checkpoints to surface a handful of actionable coaching nudges.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Sparkles size={18} className="animate-pulse" /> Reviewing Your Classes...</> : <><Sparkles size={18} /> Get This Week&apos;s Nudges</>}
          </button>
        </div>
      </div>

      {complete && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {nudges.map((n, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">{n.tag}</span>
                <Lightbulb size={16} className="text-amber-400" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{n.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{n.detail}</p>
            </div>
          ))}
        </div>
      )}
      {!complete && <AIEmptyState icon={Lightbulb} title="No Nudges Yet" subtitle="Run the coaching engine to get this week's personalized insights." />}
    </div>
  );
}
