"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import RiskBadge from "@/components/ai/RiskBadge";
import { useAIScan } from "@/lib/useAIScan";
import { UserMinus, TrendingDown } from "lucide-react";

const staff = [
  { name: "Mr. D. Clark", tenure: "4 yrs", role: "MYP Coordinator", risk: "high" as const, signals: ["Workload index at 88% for 3 consecutive terms", "Declined CPD/IB training nomination", "Below-average engagement in staff pulse survey"] },
  { name: "Ms. P. Menon", tenure: "1.5 yrs", role: "DP Visual Arts", risk: "medium" as const, signals: ["No salary review logged in 14 months", "Two late leave requests flagged as stress-related"] },
  { name: "Mr. K. Iyer", tenure: "6 yrs", role: "MYP Sciences", risk: "low" as const, signals: ["Stable workload, positive sentiment trend"] },
];

export default function AttritionRiskPage() {
  const { running, complete, run } = useAIScan(2500);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Staff Attrition Risk Predictor"
        description="Combines workload index, CPD/IB training engagement, leave patterns and staff pulse-survey sentiment to flag teachers at risk of leaving."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={UserMinus}
            title="Retention Model"
            description="Runs a retention-risk score across all teaching staff using HR, timetable and survey signals from the last 12 months."
            runLabel="Run Retention Scan"
            runningLabel="Scoring Staff..."
            completeLabel="Scan Complete"
            completeSubLabel="1 staff member flagged High Risk"
            running={running}
            complete={complete}
            onRun={run}
            accent="rose"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {staff.map((s, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.role} · {s.tenure} tenure</p>
                    </div>
                    <RiskBadge level={s.risk} />
                  </div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                    {s.signals.map((sig, j) => (
                      <li key={j} className="flex items-start gap-2"><TrendingDown size={13} className="mt-0.5 text-slate-400 shrink-0" /> {sig}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={UserMinus} title="Awaiting Scan" subtitle="Run the model to identify staff members showing early attrition signals." />
          )}
        </div>
      </div>
    </div>
  );
}
