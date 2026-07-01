"use client";

export type RiskLevel = "low" | "medium" | "high" | "critical";

const CONFIG: Record<RiskLevel, { label: string; bg: string; text: string }> = {
  low: { label: "Low Risk", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  medium: { label: "Medium Risk", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  high: { label: "High Risk", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  critical: { label: "Critical", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

export default function RiskBadge({ level, label }: { level: RiskLevel; label?: string }) {
  const c = CONFIG[level];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      {label || c.label}
    </span>
  );
}
