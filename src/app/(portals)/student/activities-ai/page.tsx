"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, Trophy, Users } from "lucide-react";

const activities = [
  { name: "Model United Nations Club", reason: "Matches your strong Individuals & Societies grades and interest tags (debate, global politics)", match: 92, cas: "Activity" },
  { name: "Robotics & Design Team", reason: "Complements your Mathematics & Physics strengths; counts toward CAS Creativity strand", match: 85, cas: "Creativity" },
  { name: "Community Tutoring Programme", reason: "Fulfils CAS Service strand; you've shown interest in peer mentoring through past activity logs", match: 80, cas: "Service" },
];

export default function ActivityRecommenderPage() {
  const { running, complete, run } = useAIScan(2300);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Activity Recommender"
        description="Suggests clubs and CAS (Creativity, Activity, Service) opportunities matched to your strengths, interests and portfolio gaps."
      />

      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-emerald-300" /> Match Engine</h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">
            Looks at your academic strengths, stated interests and current CAS strand balance to recommend clubs worth joining.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Trophy size={18} className="animate-pulse" /> Matching Activities...</> : <><Trophy size={18} /> Recommend Activities for Me</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activities.map((a, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 text-sm">{a.match}%</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{a.name}</p>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold">{a.cas}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{a.reason}</p>
              </div>
              <Users size={16} className="text-slate-300 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={Trophy} title="No Recommendations Yet" subtitle="Run the engine to see clubs and CAS opportunities matched to you." />
      )}
    </div>
  );
}
