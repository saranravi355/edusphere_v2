"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, ExternalLink, Loader2, X } from "lucide-react";

import { TONE_META, type Tone } from "@/lib/accreditation/coverage";
import {
  CATEGORY_LABELS,
  EVIDENCE_KIND_LABELS,
  type Category,
  type EvidenceKind,
} from "@/lib/accreditation/standards";
import { confirmTag, rejectTag } from "./actions";

interface QueueRow {
  id: string;
  standardKey: string;
  practiceTitle: string;
  kind: EvidenceKind;
  sourceLabel: string;
  note: string | null;
  taggedBy: string;
  taggedAt: string;
}

interface PracticeRow {
  key: string;
  category: Category;
  title: string;
  description: string;
  tone: Tone;
  count: number;
  expects: string[];
  evidence: { id: string; kind: EvidenceKind; label: string; href: string | null }[];
}

export default function AccreditationClient({
  queue,
  practices,
  summary,
  categoryOrder,
}: {
  queue: QueueRow[];
  practices: PracticeRow[];
  summary: { wellEvidenced: number; thin: number; gaps: number; total: number; orphanKeys: string[] };
  categoryOrder: Category[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function act(fn: (id: string) => Promise<{ success: true } | { error: string }>, id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await fn(id);
      if ("error" in result) setError(result.error);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* The coordinator's actual recurring job, so it leads. */}
      <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">
          Awaiting confirmation
          <span className="ml-2 text-xs font-bold text-slate-400">{queue.length}</span>
        </h2>
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">
            Nothing waiting. Tags teachers add from their own screens appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {queue.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.practiceTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {EVIDENCE_KIND_LABELS[row.kind]}: {row.sourceLabel}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {row.taggedBy} · {row.taggedAt}
                  </p>
                  {row.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">“{row.note}”</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => act(confirmTag, row.id)}
                    disabled={pendingId === row.id}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {pendingId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Confirm
                  </button>
                  <button
                    onClick={() => act(rejectTag, row.id)}
                    disabled={pendingId === row.id}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      </section>

      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {summary.wellEvidenced} of {summary.total} well evidenced · {summary.thin} thin · {summary.gaps}{" "}
        {summary.gaps === 1 ? "gap" : "gaps"}
      </p>

      {summary.orphanKeys.length > 0 && (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {summary.orphanKeys.length} tag{summary.orphanKeys.length === 1 ? "" : "s"} point at practices that
          are no longer in the taxonomy ({summary.orphanKeys.join(", ")}). They count towards nothing.
        </p>
      )}

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
                          <p className="text-xs text-slate-500">
                            No confirmed evidence. Can be evidenced by: {p.expects.join(", ")}.
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {p.evidence.map((e) => (
                              <li key={e.id} className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{EVIDENCE_KIND_LABELS[e.kind]}:</span>{" "}
                                {e.href ? (
                                  <Link href={e.href} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                    {e.label} <ExternalLink size={10} />
                                  </Link>
                                ) : (
                                  e.label
                                )}
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
