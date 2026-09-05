"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A compact, single-row link into one AI feature's own page, meant to be dropped
 * directly into the workflow page that feature actually supports (Quizzes, Grading,
 * Attendance, ...) rather than making people go find it in the AI Tools/AI Insights
 * hub first. The hub still lists every tool - this is a second, contextual entry
 * point, not a replacement.
 */
export default function AIFeatureLink({
  href, icon, title, description,
}: { href: string; icon?: ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl px-4 py-3 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
    >
      <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        {icon ?? <Sparkles size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <ArrowRight size={14} className="shrink-0 text-indigo-500 group-hover:translate-x-0.5 transition-transform" aria-hidden />
    </Link>
  );
}
