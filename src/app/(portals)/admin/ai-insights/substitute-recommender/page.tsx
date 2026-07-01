"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { useAIScan } from "@/lib/useAIScan";
import { UserCheck, Star } from "lucide-react";

const candidates = [
  { name: "Mr. K. Iyer", match: 96, reason: "Currently teaches MYP Sciences; free Periods 3-4 today; previously covered this exact unit", load: "Low" },
  { name: "Ms. P. Menon", match: 81, reason: "DP Visual Arts background overlaps with cross-disciplinary unit content; free Period 4", load: "Low" },
  { name: "Mrs. A. Davis", match: 64, reason: "Available but currently at 95% workload index — not recommended unless urgent", load: "High" },
];

export default function SubstituteRecommenderPage() {
  const { running, complete, run } = useAIScan(2200);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Substitute Teacher Recommender"
        description="Suggests the best-fit substitute for an absent teacher's period, factoring subject familiarity, current free periods, and existing workload."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={UserCheck}
            title="Cover Finder"
            description="Open absence: Mr. D. Clark, MYP4 Individuals & Societies, Period 3 today. Find the best available substitute."
            runLabel="Find Best Substitute"
            runningLabel="Matching Staff..."
            completeLabel="Match Found"
            completeSubLabel="Top candidate: Mr. K. Iyer (96% match)"
            running={running}
            complete={complete}
            onRun={run}
            accent="emerald"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {candidates.map((c, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    {c.match}%
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                      {i === 0 && <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Star size={12} fill="currentColor" /> Top Match</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{c.reason}</p>
                    <p className="text-xs text-slate-400 mt-1">Current workload: {c.load}</p>
                  </div>
                  {i === 0 && <button className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shrink-0">Assign</button>}
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={UserCheck} title="No Match Yet" subtitle="Run the recommender to find the best substitute for the open period." />
          )}
        </div>
      </div>
    </div>
  );
}
