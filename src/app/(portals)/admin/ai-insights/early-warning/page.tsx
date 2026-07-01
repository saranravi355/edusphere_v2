"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import RiskBadge from "@/components/ai/RiskBadge";
import { useAIScan } from "@/lib/useAIScan";
import { AlertTriangle, BrainCircuit, TrendingDown } from "lucide-react";

const flagged = [
  { name: "Rohan Verma", grade: "DP2", subject: "Mathematics: Analysis & Approaches HL", signal: "Predicted grade dropped 6 → 4 over two reporting periods", risk: "high" as const, ia: "IA draft overdue by 9 days" },
  { name: "Aanya Kapoor", grade: "DP1", subject: "Chemistry SL", signal: "ATL self-management scores declining; 3 missed formative checkpoints", risk: "medium" as const, ia: "On track" },
  { name: "Ethan Fernandes", grade: "MYP4", subject: "Individuals & Societies", signal: "Criterion C & D scores below MYP grade boundary for 2 consecutive units", risk: "medium" as const, ia: "N/A" },
  { name: "Priya Nair", grade: "DP2", subject: "English A: Literature HL", signal: "Extended Essay supervisor meetings missed twice; no RPPF entry in 5 weeks", risk: "high" as const, ia: "EE at risk" },
];

export default function EarlyWarningPage() {
  const { running, complete, run } = useAIScan(2600);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Early Academic Risk Detection"
        description="Cross-references predicted grades, ATL skill trends, IA/EE checkpoints and attendance to flag DP and MYP students drifting off track."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={BrainCircuit}
            title="Risk Model"
            description="Analyzes predicted-grade deltas, ATL skill ratings, IA/EE milestone adherence and attendance across all DP and MYP cohorts."
            runLabel="Run Risk Scan"
            runningLabel="Scanning Cohorts..."
            completeLabel="Scan Complete"
            completeSubLabel="4 students flagged across DP1, DP2 and MYP4"
            running={running}
            complete={complete}
            onRun={run}
            accent="rose"
          />
        </div>

        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={18} /> Flagged Students
              </h3>
              {flagged.map((s, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{s.name} <span className="text-slate-400 font-normal text-sm">· {s.grade}</span></p>
                      <p className="text-xs text-slate-500">{s.subject}</p>
                    </div>
                    <RiskBadge level={s.risk} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                    <TrendingDown size={14} className="inline mr-1 text-rose-500" /> {s.signal}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">IA/EE status: {s.ia}</p>
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={AlertTriangle} title="Awaiting Scan" subtitle="Run the model to surface students at risk of falling behind predicted-grade trajectory." />
          )}
        </div>
      </div>
    </div>
  );
}
