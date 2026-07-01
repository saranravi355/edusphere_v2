"use client";

import { LucideIcon, Sparkles } from "lucide-react";

interface AIControlPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  runLabel: string;
  runningLabel: string;
  completeLabel: string;
  completeSubLabel?: string;
  running: boolean;
  complete: boolean;
  onRun: () => void;
  accent?: "indigo" | "emerald" | "rose" | "amber" | "sky";
}

const ACCENTS = {
  indigo: { icon: "text-indigo-500", btn: "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400", successBg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50", successText: "text-indigo-700 dark:text-indigo-400", successSub: "text-indigo-600 dark:text-indigo-500" },
  emerald: { icon: "text-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400", successBg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50", successText: "text-green-700 dark:text-green-400", successSub: "text-green-600 dark:text-green-500" },
  rose: { icon: "text-rose-500", btn: "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400", successBg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50", successText: "text-rose-700 dark:text-rose-400", successSub: "text-rose-600 dark:text-rose-500" },
  amber: { icon: "text-amber-500", btn: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400", successBg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50", successText: "text-amber-700 dark:text-amber-400", successSub: "text-amber-600 dark:text-amber-500" },
  sky: { icon: "text-sky-500", btn: "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400", successBg: "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50", successText: "text-sky-700 dark:text-sky-400", successSub: "text-sky-600 dark:text-sky-500" },
};

export default function AIControlPanel({
  icon: Icon, title, description, runLabel, runningLabel, completeLabel, completeSubLabel,
  running, complete, onRun, accent = "indigo",
}: AIControlPanelProps) {
  const a = ACCENTS[accent];
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Icon size={18} className={a.icon} />
        {title}
      </h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>

      {!complete ? (
        <button
          onClick={onRun}
          disabled={running}
          className={`w-full py-2.5 ${a.btn} text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md`}
        >
          {running ? (
            <><Sparkles className="animate-pulse" size={18} /> {runningLabel}</>
          ) : (
            runLabel
          )}
        </button>
      ) : (
        <div className={`${a.successBg} border p-4 rounded-xl text-center`}>
          <p className={`font-bold ${a.successText} text-sm mb-1`}>{completeLabel}</p>
          {completeSubLabel && <p className={`text-xs ${a.successSub}`}>{completeSubLabel}</p>}
          <button onClick={onRun} className="text-xs underline mt-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Run again</button>
        </div>
      )}
    </div>
  );
}
