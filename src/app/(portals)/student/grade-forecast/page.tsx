"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { useProgramme } from "@/components/students/ProgrammeProvider";
import { mypGradeFromCriteria } from "@/lib/ib/mypGrade";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * A full Diploma: six subjects, three at Higher Level, plus the core — out of 45.
 * The subjects are the package most DP students here take, and the total (38) is
 * the figure the university and scholarship previews quote.
 */
const forecast = [
  { subject: "English A: Language & Literature SL", current: 5, predicted: 6, trend: "up" },
  { subject: "Spanish B SL", current: 5, predicted: 5, trend: "flat" },
  { subject: "Economics HL", current: 6, predicted: 6, trend: "flat" },
  { subject: "Physics HL", current: 5, predicted: 6, trend: "up" },
  { subject: "Mathematics: Analysis & Approaches HL", current: 6, predicted: 5, trend: "down" },
  { subject: "Visual Arts SL", current: 7, predicted: 7, trend: "flat" },
];

/** TOK and EE are graded A–E and meet in the IB core matrix: B with A earns 3. */
const core = { tok: "B", ee: "A", points: 3 };

/**
 * An MYP5 student in all eight subject groups. There is no points total to add
 * up: each subject's grade is the IB conversion of its four criterion levels
 * (0–8 each, 32 in all), computed here with the same table the gradebook uses,
 * so this preview cannot disagree with it.
 */
const MYP_SUBJECTS: { subject: string; criteria: [number, number, number, number]; predicted: number }[] = [
  { subject: "Language & Literature", criteria: [6, 5, 6, 5], predicted: 6 },
  { subject: "Language Acquisition: Spanish", criteria: [5, 5, 4, 5], predicted: 5 },
  { subject: "Individuals & Societies", criteria: [6, 6, 5, 6], predicted: 6 },
  { subject: "Sciences", criteria: [5, 6, 4, 5], predicted: 5 },
  { subject: "Mathematics", criteria: [7, 6, 6, 7], predicted: 6 },
  { subject: "Arts", criteria: [7, 7, 6, 7], predicted: 7 },
  { subject: "Physical & Health Education", criteria: [6, 7, 7, 6], predicted: 6 },
  { subject: "Design", criteria: [6, 5, 6, 6], predicted: 5 },
];

const mypRows = MYP_SUBJECTS.map((s) => {
  const current = mypGradeFromCriteria(...s.criteria) as number;
  const total = s.criteria.reduce((a, b) => a + b, 0);
  const trend = s.predicted > current ? "up" : s.predicted < current ? "down" : "flat";
  return { ...s, current, total, trend };
});

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColor = { up: "text-emerald-500", down: "text-rose-500", flat: "text-slate-400" };

const ROW = "p-4 flex items-center justify-between gap-4";
const PREDICTED = "w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm";

export default function GradeForecastPage() {
  const { running, complete, run } = useAIScan(2500);
  const isMyp = useProgramme() === "MYP";
  const subjectTotal = forecast.reduce((sum, f) => sum + f.predicted, 0);
  const total = subjectTotal + core.points;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Predictive Grade Forecast"
        description={
          isMyp
            ? "Projects your MYP subject grades (1–7) from your criterion levels in each subject group."
            : "Projects your final IB Diploma subject grades (1–7 scale) based on current formative and summative performance trends."
        }
      />

      <AIPreviewNotice />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={150} /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles size={18} className="text-indigo-300" /> Forecast Engine</h2>
          <p className="text-indigo-200 text-sm mb-6 max-w-lg leading-relaxed">
            {isMyp
              ? "Uses your criterion levels this term to project where each subject grade is trending, ahead of report cards."
              : "Uses your assessment history this term to project where your final subject grades are trending, ahead of report cards."}
          </p>
          <button onClick={run} disabled={running} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
            {running ? <><Sparkles size={18} className="animate-pulse" /> Forecasting...</> : <><Sparkles size={18} /> Forecast My Grades</>}
          </button>
        </div>
      </div>

      {!complete ? (
        <AIEmptyState icon={Sparkles} title="No Forecast Yet" subtitle="Run the forecast to see where your grades are trending this term." />
      ) : isMyp ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {mypRows.map((r, i) => {
            const Icon = trendIcon[r.trend as keyof typeof trendIcon];
            return (
              <div key={i} className={ROW}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.subject}</p>
                  <p className="text-[11px] font-mono text-slate-400">A–D {r.criteria.join(" · ")} · {r.total}/32</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">Current: {r.current}</span>
                  <Icon size={16} className={trendColor[r.trend as keyof typeof trendColor]} />
                  <span className={PREDICTED}>{r.predicted}</span>
                </div>
              </div>
            );
          })}
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500">
            Current grades are the IB conversion of each criterion total out of 32 — the same table your gradebook uses.
            Personal Project report due in 9 days.
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {forecast.map((f, i) => {
            const Icon = trendIcon[f.trend as keyof typeof trendIcon];
            return (
              <div key={i} className={ROW}>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.subject}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">Current: {f.current}</span>
                  <Icon size={16} className={trendColor[f.trend as keyof typeof trendColor]} />
                  <span className={PREDICTED}>{f.predicted}</span>
                </div>
              </div>
            );
          })}
          <div className={ROW}>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Theory of Knowledge {core.tok} · Extended Essay {core.ee}
            </span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">+{core.points} core points</span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-500">
            Predicted DP total: {subjectTotal}/42 from six subjects + {core.points}/3 core ={" "}
            <span className="font-bold text-slate-700 dark:text-slate-300">{total} / 45</span>
          </div>
        </div>
      )}
    </div>
  );
}
