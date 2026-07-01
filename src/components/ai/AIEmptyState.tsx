"use client";

import { LucideIcon } from "lucide-react";

export default function AIEmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
      <Icon size={64} className="mb-4 opacity-20" />
      <p className="font-medium text-slate-600 dark:text-slate-300">{title}</p>
      <p className="text-sm max-w-xs text-center mt-2">{subtitle}</p>
    </div>
  );
}
