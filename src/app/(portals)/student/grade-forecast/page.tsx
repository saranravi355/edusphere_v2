"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

const forecast = [
  { subject: "Mathematics: Analysis & Approaches HL", current: 5, predicted: 6, trend: "up" },
  { subject: "Chemistry SL", current: 6, predicted: 6, trend: "flat" },
  { subject: "English A: Literature HL", current: 6, predicted: 5, trend: "down" },
  { subject: "Economics SL", current: 7, predicted: 7, trend: "flat" },
  { subject: "Theory of Knowledge", current: "B", predicted: "B", trend: "flat" },
];

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColor = { up: "text-emerald-500", down: "text-rose-500", flat: "text-slate-400" };

export default function GradeForecastPage() {
  const { running, complete, run } = useAIScan(2500);
  const totalPoints = 5 + 6 + 5 + 7; // simplified subject points contribution preview

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Predictive Grade Forecast"
        description="Projects your final IB Diploma subject grades (1–7 scale) based on current formative and summative performance trends."
      />

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-indigo-300" /> Forecast Engine</h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-lg leading-relaxed">
            Uses your assessment history this term to project where your final subject grades are trending, ahead of report cards.
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Sparkles size={18} className="animate-pulse" /> Forecasting...</> : <><Sparkles size={18} /> Forecast My Grades</>}
          </button>
        </div>
      </div>

      {complete ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {forecast.map((f, i) => {
            const Icon = trendIcon[f.trend as keyof typeof trendIcon];
            return (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.subject}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">Current: {f.current}</span>
                  <Icon size={16} className={trendColor[f.trend as keyof typeof trendColor]} />
                  <span className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">{f.predicted}</span>
                </div>
              </div>
            );
          })}
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500">
            Projected DP total (subject grades only, excl. TOK/EE points): <span className="font-bold text-slate-700 dark:text-slate-300">{totalPoints} / 28</span>
          </div>
        </div>
      ) : (
        <AIEmptyState icon={Sparkles} title="No Forecast Yet" subtitle="Run the forecast to see where your grades are trending this term." />
      )}
    </div>
  );
}
