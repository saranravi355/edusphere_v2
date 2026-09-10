"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { Sparkles, GraduationCap, Lightbulb } from "lucide-react";

// One sciences teacher's week, at this school's real group sizes. The old
// second nudge described "a 22-point spread" in criterion B scores; MYP criteria
// run from 0 to 8, so no spread can exceed 8.
const nudges = [
  { title: "ATL Skill Gap: Self-Management", detail: "3 of your 8 DP1 Chemistry HL students missed formative deadlines twice this unit. A short ATL session on planning before the next IA checkpoint would reach all of them.", tag: "ATL" },
  { title: "Differentiation Opportunity", detail: "In your last MYP4 Sciences unit, criterion B levels ranged from 2 to 8. The two students at level 2 may need a scaffolded planning sheet for the next investigation.", tag: "Assessment" },
  { title: "CAS Supervision Reminder", detail: "Your CAS group's reflection log hasn't been updated in 3 weeks. The CAS portfolio needs reflections spread across the 18 months, not collected at the end.", tag: "CAS" },
  { title: "Positive Trend", detail: "Criterion A levels in your MYP4 Sciences class are up since you introduced retrieval starters — four students moved up a band this unit.", tag: "Praise" },
];

export default function AICoachPage() {
  const { running, complete, run } = useAIScan(2200);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="AI Coaching Nudges"
        description="Personalized, weekly teaching insights drawn from your gradebook, attendance and ATL/CAS records — built for IB pedagogy."
      />

      <AIPreviewNotice />

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
