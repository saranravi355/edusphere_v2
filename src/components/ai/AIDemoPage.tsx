"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, MessageSquare, Quote } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import AIControlPanel from "@/components/ai/AIControlPanel";
import AIEmptyState from "@/components/ai/AIEmptyState";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import RiskBadge from "@/components/ai/RiskBadge";
import { useAIScan } from "@/lib/useAIScan";

/**
 * The shape every AI preview screen shares.
 *
 * The existing AI mock-ups each hand-rolled the same layout: a control panel on
 * the left, an empty state that becomes results on the right, and a scan that
 * takes a couple of seconds. Twenty-five more copies of that would be twenty-five
 * chances to get the spacing, the dark-mode colours or the accessibility wrong,
 * and one more place to forget the preview notice. So the arrangement is written
 * once here and each feature supplies only what differs.
 *
 * Three result shapes cover everything on the list: a set of findings, a
 * generated document, and a retrieval-style answer with its sources.
 */

export type Tone = "critical" | "high" | "medium" | "low";

/** A row of analysis: a flagged student, a ranked candidate, a detected pattern. */
export interface Finding {
  title: string;
  /** Small grey text after the title — a class, a subject, a date. */
  meta?: string;
  /** The substance: what was found and on what evidence. */
  body: string;
  /** Optional right-hand badge. */
  tone?: Tone;
  /** Override the badge wording — "Strong match" reads better than "Low Risk". */
  badgeLabel?: string;
  /** Optional third line, e.g. a recommended action. */
  footnote?: string;
}

/** Generated prose: a lesson plan, a revision sheet, a meeting brief. */
export interface DocumentSection {
  heading: string;
  lines: string[];
}

/** A retrieval answer, with the documents it came from. */
export interface Exchange {
  question: string;
  answer: string;
  sources: string[];
}

export type DemoResult =
  | { kind: "findings"; heading: string; items: Finding[] }
  | { kind: "document"; heading: string; sections: DocumentSection[] }
  | { kind: "chat"; heading: string; exchanges: Exchange[] };

export interface AIDemoPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "rose" | "amber" | "sky";
  panelTitle: string;
  panelDescription: string;
  runLabel: string;
  runningLabel: string;
  completeLabel: string;
  completeSubLabel?: string;
  emptyTitle: string;
  emptySubtitle: string;
  result: DemoResult;
  /** Override the standard preview wording where something more specific helps. */
  previewNote?: React.ReactNode;
  durationMs?: number;
}

const CARD =
  "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm";

export default function AIDemoPage({
  title, description, icon, accent = "indigo",
  panelTitle, panelDescription, runLabel, runningLabel, completeLabel, completeSubLabel,
  emptyTitle, emptySubtitle, result, previewNote, durationMs = 2400,
}: AIDemoPageProps) {
  const { running, complete, run } = useAIScan(durationMs);

  const emptyIcon =
    result.kind === "document" ? FileText : result.kind === "chat" ? MessageSquare : icon;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader title={title} description={description} />
      <AIPreviewNotice>{previewNote}</AIPreviewNotice>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIControlPanel
            icon={icon}
            title={panelTitle}
            description={panelDescription}
            runLabel={runLabel}
            runningLabel={runningLabel}
            completeLabel={completeLabel}
            completeSubLabel={completeSubLabel}
            running={running}
            complete={complete}
            onRun={run}
            accent={accent}
          />
        </div>

        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{result.heading}</h3>

              {result.kind === "findings" &&
                result.items.map((f, i) => (
                  <div key={i} className={CARD}>
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {f.title}
                          {f.meta && <span className="text-slate-400 font-normal text-sm"> · {f.meta}</span>}
                        </p>
                      </div>
                      {f.tone && <RiskBadge level={f.tone} label={f.badgeLabel} />}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                      {f.body}
                    </p>
                    {f.footnote && <p className="text-xs text-slate-400 mt-2">{f.footnote}</p>}
                  </div>
                ))}

              {result.kind === "document" && (
                <div className={CARD}>
                  {result.sections.map((s, i) => (
                    <div key={i} className={i > 0 ? "mt-5 pt-5 border-t border-slate-100 dark:border-zinc-800" : ""}>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">{s.heading}</p>
                      <ul className="space-y-1.5">
                        {s.lines.map((l, j) => (
                          <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                            <span className="text-slate-300 dark:text-zinc-600 select-none">—</span>
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {result.kind === "chat" &&
                result.exchanges.map((e, i) => (
                  <div key={i} className={CARD}>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex gap-2">
                      <MessageSquare size={16} className="text-indigo-500 mt-0.5 shrink-0" aria-hidden />
                      {e.question}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{e.answer}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Sources</p>
                      <ul className="space-y-1">
                        {e.sources.map((s, j) => (
                          <li key={j} className="text-xs text-slate-500 flex gap-1.5">
                            <Quote size={11} className="mt-0.5 shrink-0 text-slate-300 dark:text-zinc-600" aria-hidden />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <AIEmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />
          )}
        </div>
      </div>
    </div>
  );
}
