"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { LineChart, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

const months = [
  { name: "Jul", inflow: 92, outflow: 68 },
  { name: "Aug", inflow: 41, outflow: 70 },
  { name: "Sep", inflow: 38, outflow: 72 },
  { name: "Oct", inflow: 88, outflow: 69 },
  { name: "Nov", inflow: 35, outflow: 74 },
  { name: "Dec", inflow: 30, outflow: 71 },
];

export default function CashflowForecastPage() {
  const { running, complete, run } = useAIScan(2600);
  const max = 100;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="AI Cash Flow Forecast"
        description="Projects 6-month cash inflow (term fee cycles) against outflow (payroll, vendor, facilities) to flag upcoming liquidity gaps."
      />

      <div className="bg-gradient-to-br from-slate-900 to-zinc-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/40">
        <div className="absolute top-0 right-0 p-8 opacity-10"><LineChart size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Forecast Engine</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
            Combines fee-cycle schedules, payroll calendar and historical vendor spend to project monthly cash position over the next two terms.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><LineChart size={18} className="animate-pulse" /> Forecasting...</> : <><LineChart size={18} /> Run 6-Month Forecast</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-6 mb-6 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Projected Inflow</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-400"></span> Projected Outflow</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div className="w-1/2 bg-emerald-500 rounded-t-md" style={{ height: `${(m.inflow / max) * 100}%` }} />
                  <div className="w-1/2 bg-slate-400 dark:bg-slate-600 rounded-t-md" style={{ height: `${(m.outflow / max) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500">{m.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
            <TrendingDown className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Liquidity Gap Projected: Aug, Sep, Nov, Dec</p>
              <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">Outflow exceeds inflow in 4 of the next 6 months — between fee-cycle collection windows. Consider a working-capital buffer or staggered vendor payments.</p>
            </div>
          </div>
          <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
            <TrendingUp className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Surplus Months: Jul, Oct</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Term fee collection windows — recommended for building reserve buffer ahead of low-inflow months.</p>
            </div>
          </div>
        </div>
      ) : (
        <AIEmptyState icon={LineChart} title="No Forecast Yet" subtitle="Run the forecast to see projected cash position over the next 6 months." />
      )}
    </div>
  );
}
