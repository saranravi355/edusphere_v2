"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Check, Loader2, Plus, ShieldQuestion, X } from "lucide-react";

import {
  confirmTag,
  rejectTag,
  tagEvidence,
} from "@/app/(portals)/admin/accreditation/actions";
import {
  practiceByKey,
  practicesFor,
  type EvidenceKind,
} from "@/lib/accreditation/standards";

export interface TagView {
  id: string;
  standardKey: string;
  status: string;
  note: string | null;
}

/**
 * Tag one record as evidence for an IB practice.
 *
 * Appears inside five screens that already exist rather than in a page of its
 * own, because the coordinator tagging everything centrally is the manual slog
 * this module removes. The picker offers only the practices this kind of
 * record can plausibly evidence — six on a lesson plan, not all eighteen.
 *
 * `readOnly` is the student's view of their own portfolio: confirmed tags
 * shown, nothing to click. A student asserting that their own work evidences
 * an IB standard is not evidence.
 */
export default function EvidenceTagger({
  kind,
  recordId,
  tags,
  canConfirm = false,
  readOnly = false,
}: {
  kind: EvidenceKind;
  recordId: string;
  tags: TagView[];
  canConfirm?: boolean;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [chosen, setChosen] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = practicesFor(kind);
  const alreadyTagged = new Set(tags.filter((t) => t.status !== "REJECTED").map((t) => t.standardKey));
  const available = options.filter((p) => !alreadyTagged.has(p.key));

  const shown = readOnly ? tags.filter((t) => t.status === "CONFIRMED") : tags.filter((t) => t.status !== "REJECTED");

  async function submitAsync() {
    if (!chosen) return;
    setError(null);
    const result: { success: true } | { error: string } = await tagEvidence({ kind, recordId, standardKey: chosen, note });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setChosen("");
    setNote("");
    setOpen(false);
  }

  function submit() {
    startTransition(submitAsync);
  }

  function act(fn: (id: string) => Promise<{ success: true } | { error: string }>, id: string) {
    setError(null);
    startTransition(async () => {
      const result = await fn(id);
      if ("error" in result) setError(result.error);
    });
  }

  if (readOnly && shown.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((t) => {
          const practice = practiceByKey(t.standardKey);
          const confirmed = t.status === "CONFIRMED";
          return (
            <span
              key={t.id}
              title={practice?.description ?? t.standardKey}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                confirmed
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {confirmed ? <BadgeCheck size={11} /> : <ShieldQuestion size={11} />}
              {practice?.title ?? t.standardKey}
              {canConfirm && !confirmed && (
                <>
                  <button
                    onClick={() => act(confirmTag, t.id)}
                    disabled={pending}
                    aria-label={`Confirm ${practice?.title ?? t.standardKey}`}
                    className="ml-0.5 hover:text-emerald-800 disabled:opacity-50"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={() => act(rejectTag, t.id)}
                    disabled={pending}
                    aria-label={`Reject ${practice?.title ?? t.standardKey}`}
                    className="hover:text-rose-700 disabled:opacity-50"
                  >
                    <X size={11} />
                  </button>
                </>
              )}
            </span>
          );
        })}

        {!readOnly && available.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300"
          >
            <Plus size={11} /> Tag as evidence
          </button>
        )}
      </div>

      {open && !readOnly && (
        <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 space-y-2">
          <select
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          >
            <option value="">Choose an IB practice…</option>
            {available.map((p) => (
              <option key={p.key} value={p.key}>
                {p.title}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Why does this evidence that practice? (optional)"
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={pending || !chosen}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {pending && <Loader2 size={12} className="animate-spin" />} Tag
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
