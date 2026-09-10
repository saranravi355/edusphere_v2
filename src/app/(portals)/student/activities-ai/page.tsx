"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { Sparkles, Trophy, Users } from "lucide-react";

type Activity = { name: string; reason: string; match: number; tag: string };

// The school's own clubs. For a DP student each is filed under the CAS strand it
// counts towards; for an MYP student there is no CAS, so the tag says what the
// club builds on instead — Service as Action, a subject, an ATL skill.
const CONTENT: Record<"DP" | "MYP", { description: string; panel: string; empty: string; activities: Activity[] }> = {
  DP: {
    description: "Suggests clubs and CAS (Creativity, Activity, Service) opportunities matched to your strengths, interests and portfolio gaps.",
    panel: "Looks at your academic strengths, stated interests and current CAS strand balance to recommend clubs worth joining.",
    empty: "Run the engine to see clubs and CAS opportunities matched to you.",
    activities: [
      { name: "Community Service (CAS)", reason: "Your CAS record is lightest on Service. This group runs a weekly tutoring project with a government school near Whitefield.", match: 92, tag: "Service" },
      { name: "Robotics Club", reason: "Builds on your Physics HL and Mathematics AA HL strengths, and counts towards the CAS Creativity strand.", match: 85, tag: "Creativity" },
      { name: "Basketball", reason: "Counts towards the Activity strand, and practice falls in your free last period on Wednesdays.", match: 78, tag: "Activity" },
    ],
  },
  MYP: {
    description: "Suggests clubs and Service as Action opportunities matched to your strengths and interests.",
    panel: "Looks at your subject strengths, stated interests and your Service as Action record to recommend clubs worth joining.",
    empty: "Run the engine to see clubs and Service as Action opportunities matched to you.",
    activities: [
      { name: "Community Service (CAS)", reason: "Open to MYP students as Service as Action. The weekly tutoring project with a government school near Whitefield would give you something real to reflect on.", match: 90, tag: "Service as Action" },
      { name: "Robotics Club", reason: "Builds on your Design and Mathematics strengths — the club plans its builds with the same design cycle you use in class.", match: 86, tag: "Design" },
      { name: "Debate Society", reason: "Develops the communication skills your Language & Literature criterion D feedback points to.", match: 80, tag: "ATL: Communication" },
      { name: "Basketball", reason: "Fits your Physical & Health Education strengths, and practice falls in your free last period on Wednesdays.", match: 74, tag: "PHE" },
    ],
  },
};

export default function ActivityRecommenderPage() {
  const { running, complete, run } = useAIScan(2300);
  const c = CONTENT[useProgramme()];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader title="Activity Recommender" description={c.description} />

      <AIPreviewNotice />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-emerald-300" /> Match Engine</h2>
          <p className="text-emerald-200 text-sm mb-6 max-w-lg leading-relaxed">{c.panel}</p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Trophy size={18} className="animate-pulse" /> Matching Activities...</> : <><Trophy size={18} /> Recommend Activities for Me</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {c.activities.map((a, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 text-sm">{a.match}%</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{a.name}</p>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold shrink-0">{a.tag}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{a.reason}</p>
              </div>
              <Users size={16} className="text-slate-300 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <AIEmptyState icon={Trophy} title="No Recommendations Yet" subtitle={c.empty} />
      )}
    </div>
  );
}
