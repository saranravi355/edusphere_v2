"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Sparkles, Map, BookOpen } from "lucide-react";

type Gap = { topic: string; mastery: number; action: string };

// DP: topics from the current syllabi for the same DP student as the other
// previews. MYP: an MYP5 student's subject groups, pointed at the criterion each
// gap would cost marks in.
const GAPS: Record<"DP" | "MYP", Gap[]> = {
  DP: [
    { topic: "Physics HL — Gravitational fields", mastery: 42, action: "Review theme D.1 notes, then retry the formative quiz" },
    { topic: "Mathematics AA HL — Vectors: scalar product", mastery: 58, action: "Rework practice set 4; the perpendicular-vector questions are where marks are lost" },
    { topic: "Economics HL — Elasticity calculations", mastery: 70, action: "Redo the PED and YED worked examples, then try one Paper 2 data-response question" },
  ],
  MYP: [
    { topic: "Sciences — Balancing chemical equations", mastery: 45, action: "Rework the balancing practice sheet, then retry the criterion A formative quiz" },
    { topic: "Mathematics — Probability of combined events", mastery: 60, action: "Draw a tree diagram for each practice question; most lost marks come from adding along the branches instead of multiplying" },
    { topic: "Language Acquisition: Spanish — Preterite or imperfect", mastery: 68, action: "Sort the ten sentences from last week's reading into completed actions and background description" },
  ],
};

export default function LearningGapPage() {
  const { running, complete, run } = useAIScan(2300);
  const gaps = GAPS[useProgramme()];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Learning Gap Map"
        description="After each formative assessment, see exactly which sub-topics you're weakest on and what to review next."
      />

      <AIPreviewNotice />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-rose-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Map size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-rose-300" /> Mastery Mapper</h2>
          <p className="text-rose-200 text-sm mb-6 max-w-lg leading-relaxed">
            Analyzes your last formative test answers question-by-question to map exactly which sub-topics need more work.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Map size={18} className="animate-pulse" /> Mapping Your Gaps...</> : <><Map size={18} /> Map My Learning Gaps</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {gaps.map((g, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between gap-3 text-sm mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{g.topic}</span>
                <span className={`font-mono font-bold shrink-0 ${g.mastery >= 70 ? "text-emerald-500" : g.mastery >= 50 ? "text-amber-500" : "text-rose-500"}`}>{g.mastery}% mastery</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${g.mastery >= 70 ? "bg-emerald-500" : g.mastery >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${g.mastery}%` }} />
              </div>
              <p className="text-sm text-slate-500 flex items-start gap-2"><BookOpen size={14} className="mt-0.5 shrink-0 text-slate-400" /> {g.action}</p>
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={Map} title="No Map Yet" subtitle="Run the mapper after your next formative assessment to see your gaps." />
      )}
    </div>
  );
}
