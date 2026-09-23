"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FolderOpen } from "lucide-react";

import { TONE_META, type Tone } from "@/lib/accreditation/coverage";
import { CATEGORY_LABELS, type Category } from "@/lib/accreditation/standards";

interface PracticeRow {
  key: string;
  category: Category;
  title: string;
  description: string;
  tone: Tone;
  count: number;
  evidence: { id: string; kindLabel: string; label: string; href: string | null; note: string | null }[];
}

export default function VisitorClient({
  practices,
  summary,
  categoryOrder,
  hasAnyEvidence,
}: {
  practices: PracticeRow[];
  summary: { wellEvidenced: number; thin: number; gaps: number; total: number };
  categoryOrder: Category[];
  hasAnyEvidence: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // "0 of 18 well evidenced" on a fresh database reads as broken software
  // rather than as a process nobody has started, so say which it is.
  if (!hasAnyEvidence) {
    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 text-center">
        <FolderOpen size={28} className="mx-auto text-slate-300" />
        <h2 className="mt-3 font-bold text-slate-800 dark:text-slate-100">No evidence published yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          The school has not yet confirmed any evidence against the {summary.total} IB practices. This view
          fills as the IB coordinator confirms what teachers tag.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {summary.wellEvidenced} of {summary.total} practices well evidenced · {summary.thin} thin ·{" "}
        {summary.gaps} {summary.gaps === 1 ? "gap" : "gaps"}
      </p>

      {categoryOrder.map((category) => {
        const rows = practices.filter((p) => p.category === category);
        return (
          <section
            key={category}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5"
          >
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{CATEGORY_LABELS[category]}</h2>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows.map((p) => {
                const open = expanded === p.key;
                const meta = TONE_META[p.tone];
                return (
                  <li key={p.key} className="py-3">
                    <button
                      onClick={() => setExpanded(open ? null : p.key)}
                      className="w-full flex items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-400">{p.count}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </button>
                    {open && (
                      <div className="mt-2 pl-1">
                        {p.evidence.length === 0 ? (
                          <p className="text-xs text-slate-500">No evidence published against this practice.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {p.evidence.map((e) => (
                              <li key={e.id} className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{e.kindLabel}:</span>{" "}
                                {e.href ? (
                                  <a
                                    href={e.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    {e.label} <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  e.label
                                )}
                                {e.note && <span className="block text-slate-400 italic">“{e.note}”</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
