"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { useAIScan } from "@/lib/useAIScan";
import { HeartHandshake, MailWarning } from "lucide-react";

const families = [
  { name: "Patel Family", child: "Rohan Verma · DP2", score: 38, signals: "Missed last 2 parent-teacher conferences; portal login 0x in 30 days" },
  { name: "Reddy Family", child: "Diya Reddy · MYP3", score: 91, signals: "Active in CAS volunteering portal, attended 3/3 events this term" },
  { name: "Krishnan Family", child: "Meera Krishnan · MYP5", score: 52, signals: "Read receipts on messages but no replies in 6 weeks" },
];

export default function ParentEngagementPage() {
  const { running, complete, run } = useAIScan(2300);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Parent Engagement Score"
        description="Scores each family's engagement using portal logins, message responsiveness, event attendance and conference participation."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={HeartHandshake}
            title="Engagement Model"
            description="Computes a 0–100 engagement score per family across all communication and event-attendance channels."
            runLabel="Run Engagement Scan"
            runningLabel="Scoring Families..."
            completeLabel="Scan Complete"
            completeSubLabel="1 family flagged for re-engagement outreach"
            running={running}
            complete={complete}
            onRun={run}
            accent="sky"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {families.map((f, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${f.score >= 70 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : f.score >= 50 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                    {f.score}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{f.name}</p>
                    <p className="text-xs text-slate-500 mb-1">{f.child}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{f.signals}</p>
                  </div>
                  {f.score < 50 && <button className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"><MailWarning size={13}/> Notify</button>}
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={HeartHandshake} title="Awaiting Scan" subtitle="Run the model to see family-level engagement scores." />
          )}
        </div>
      </div>
    </div>
  );
}
