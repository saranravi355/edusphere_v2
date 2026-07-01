"use client";

import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { useAIScan } from "@/lib/useAIScan";
import { Route, Clock, Fuel } from "lucide-react";

const routes = [
  { name: "Route 4 — Whitefield Loop", before: "52 min", after: "39 min", saving: "25% time, ₹1,240/wk fuel", stops: 14 },
  { name: "Route 7 — Koramangala Express", before: "44 min", after: "38 min", saving: "14% time, ₹680/wk fuel", stops: 9 },
  { name: "Route 2 — HSR Layout", before: "35 min", after: "35 min", saving: "Already optimal", stops: 7 },
];

export default function RouteOptimiserPage() {
  const { running, complete, run } = useAIScan(2500);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Transport Route Optimiser"
        description="Re-sequences pickup/drop stops per bus route using live traffic patterns and student address clustering to cut commute time and fuel cost."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={Route}
            title="Route Optimizer"
            description="Re-runs stop sequencing for all active bus routes against current student address clusters and historical traffic data."
            runLabel="Optimise All Routes"
            runningLabel="Recomputing Routes..."
            completeLabel="Optimisation Complete"
            completeSubLabel="2 of 3 routes improved"
            running={running}
            complete={complete}
            onRun={run}
            accent="sky"
          />
        </div>
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {routes.map((r, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <span className="text-xs text-slate-400">{r.stops} stops</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm mb-2">
                    <span className="flex items-center gap-1 text-slate-500"><Clock size={14} /> {r.before} <span className="text-slate-300">→</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.after}</span></span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Fuel size={12} /> {r.saving}</p>
                </div>
              ))}
            </div>
          ) : (
            <AIEmptyState icon={Route} title="No Optimisation Yet" subtitle="Run the optimiser to recompute the most efficient stop order for each route." />
          )}
        </div>
      </div>
    </div>
  );
}
