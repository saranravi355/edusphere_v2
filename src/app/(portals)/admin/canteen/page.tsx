"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, UtensilsCrossed, AlertTriangle } from "lucide-react";

const menu = [
  { item: "Vegetable Pulao + Raita", predicted: 410, baseline: 360, note: "Higher demand expected — DP2 mock exam week, comfort-food preference pattern" },
  { item: "Grilled Paneer Wrap", predicted: 180, baseline: 195, note: "Slight dip — overlaps with Sports Day, fewer students in main canteen slot" },
  { item: "Mixed Fruit Bowl", predicted: 260, baseline: 200, note: "Spike expected — hot weather forecast for the week" },
  { item: "Masala Dosa", predicted: 300, baseline: 300, note: "Stable demand, no anomalies" },
];

export default function CanteenAIPage() {
  const { running, complete, run } = useAIScan(2400);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Canteen — Nutrition Demand Forecaster"
        description="Predicts daily meal demand per item using enrolment, weather, exam-week schedules and past consumption patterns, to cut food waste and avoid shortages."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><UtensilsCrossed size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Demand Forecast Engine</h2>
          <p className="text-amber-200 text-sm mb-6 max-w-lg leading-relaxed">
            Forecasts tomorrow&apos;s per-item meal counts using the IB exam/IA calendar, weather data, and the last 8 weeks of canteen consumption.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><UtensilsCrossed size={18} className="animate-pulse" /> Forecasting Demand...</> : <><UtensilsCrossed size={18} /> Forecast Tomorrow&apos;s Menu</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {menu.map((m, i) => {
            const delta = m.predicted - m.baseline;
            return (
              <div key={i} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{m.item}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    {Math.abs(delta) >= 40 && <AlertTriangle size={12} className="text-amber-500" />} {m.note}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{m.predicted} portions</p>
                  <p className={`text-xs font-bold ${delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {delta > 0 ? "+" : ""}{delta} vs baseline
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AIEmptyState icon={UtensilsCrossed} title="No Forecast Yet" subtitle="Run the forecaster to plan tomorrow's canteen prep quantities." />
      )}
    </div>
  );
}
