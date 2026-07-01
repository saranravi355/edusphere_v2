"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export default function AIToolCard({
  href, icon, title, description, badge,
}: { href: string; icon: ReactNode; title: string; description: string; badge?: string }) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          {icon}
        </div>
        {badge && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">{badge}</span>}
      </div>
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</p>
      <p className="text-sm text-slate-500 flex-1">{description}</p>
      <span className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
        Open <ArrowRight size={12} />
      </span>
    </Link