"use client";

export default function ScoreGauge({ score, label, max = 100 }: { score: number; label: string; max?: number }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const color = pct >= 75 ? "#48B07A" : pct >= 50 ? "#E9C46A" : "#E06A5F";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{score}</span>
          <span className="text-xs text-slate-400">/ {max}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">{label}</p>
    </div>
  );
}
