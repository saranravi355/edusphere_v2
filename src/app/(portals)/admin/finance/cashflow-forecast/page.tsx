"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { LineChart, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Six months from September, in ₹ lakh.
 *
 * The shape follows this school's own fee calendar — instalments fall due in
 * August, November and February — against a payroll that runs every month. The
 * amounts are illustrative. The bars used to be unitless, and peaked in July
 * and October, months in which this school collects nothing.
 */
const months = [
  { name: "Sep", inflow: 18, outflow: 36 },
  { name: "Oct", inflow: 6, outflow: 36 },
  { name: "Nov", inflow: 118, outflow: 37 },
  { name: "Dec", inflow: 16, outflow: 42 },
  { name: "Jan", inflow: 5, outflow: 36 },
  { name: "Feb", inflow: 120, outflow: 37 },
];

const max = Math.max(...months.flatMap((m) => [m.inflow, m.outflow]));

export default function CashflowForecastPage() {
  const { running, complete, run } = useAIScan(2600);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="AI Cash Flow Forecast"
        description="Projects six months of cash inflow (fee instalments) against outflow (payroll, vendors, facilities) to flag upcoming liquidity gaps."
      />

      <AIPreviewNotice>
        Sample forecast. The instalment months — August, November and February — follow this school&rsquo;s fee
        calendar; the amounts are illustrative, not a projection of its accounts.
      </AIPreviewNotice>

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/40">
        <div className="absolute top-0 right-0 p-8 opacity-10"><LineChart size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Forecast Engine</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
            Combines the fee-instalment calendar, the monthly payroll run and historical vendor spend to project the cash position over the next six months.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><LineChart size={18} className="animate-pulse" /> Forecasting...</> : <><LineChart size={18} /> Run 6-Month Forecast</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Projected inflow</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-400"></span> Projected outflow</span>
            <span className="text-xs text-slate-400 ml-auto">₹ lakh per month</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-52">
            {months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div className="w-1/2 bg-emerald-500 rounded-t-md" style={{ height: `${(m.inflow / max) * 100}%` }} title={`Inflow ₹${m.inflow} lakh`} />
                  <div className="w-1/2 bg-slate-400 dark:bg-slate-600 rounded-t-md" style={{ height: `${(m.outflow / max) * 100}%` }} title={`Outflow ₹${m.outflow} lakh`} />
                </div>
                <span className="text-xs text-slate-500">{m.name}</span>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">{m.inflow} / {m.outflow}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
            <TrendingDown className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Liquidity gap projected: Sep, Oct, Dec, Jan</p>
              <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">Fees arrive in three instalments but payroll runs every month, and part of the August instalment is still outstanding, so September starts short. Consider a working-capital buffer, or moving vendor payments into instalment months.</p>
            </div>
          </div>
          <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
            <TrendingUp className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Surplus months: Nov, Feb</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Instalment months — the window to rebuild a reserve before the next gap.</p>
            </div>
          </div>
        </div>
      ) : (
        <AIEmptyState icon={LineChart} title="No Forecast Yet" subtitle="Run the forecast to see projected cash position over the next 6 months." />
      )}
    </div>
  );
}
