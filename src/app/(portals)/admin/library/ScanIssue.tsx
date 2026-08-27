"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ScanLine, Check, X, Loader2, Info } from "lucide-react";
import { issueByScan, resolveScanCode, type ScanHit } from "./actions";
import { LOAN_DAYS } from "@/lib/options";

/**
 * Issue a book by scanning it and the borrower's ID card.
 *
 * This screen once had a "barcode scanner" that was a 1.5-second setTimeout
 * always returning The Principia Mathematica. That was deleted. This is not a
 * replacement for it in spirit — nothing here is simulated.
 *
 * A school barcode scanner is a keyboard-wedge device: it types what it reads
 * and presses Enter. So the two inputs below are the scanner. Point real
 * hardware at a barcode and the code lands in the focused field, Enter fires
 * the lookup, and the hit comes back from the database. Type it by hand and
 * exactly the same thing happens, which is what makes it testable without
 * hardware.
 *
 * Camera scanning — phone or webcam — is a genuinely different problem and is
 * NOT built. The panel says so in as many words rather than showing a viewfinder
 * that does nothing.
 */

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500";

function Hit({ hit, expecting }: { hit: ScanHit | null; expecting: "book" | "borrower" }) {
  if (!hit) return <p className="text-[11px] text-slate-400 mt-1">Waiting for a scan…</p>;
  if (hit.kind === "none") {
    return (
      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
        <X size={11} /> Nothing matches “{hit.code}”.
      </p>
    );
  }
  if (hit.kind !== expecting) {
    return (
      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
        <X size={11} /> That is a {hit.kind}, not a {expecting}.
      </p>
    );
  }
  return (
    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
      <Check size={11} />
      <span className="font-semibold">{hit.label}</span>
      <span className="text-slate-400">· {hit.detail}</span>
      {hit.kind === "book" && (
        <span className={hit.available > 0 ? "text-slate-400" : "text-rose-500 font-semibold"}>
          · {hit.available} available
        </span>
      )}
    </p>
  );
}

export default function ScanIssue({ isbnCoverage }: { isbnCoverage: { withIsbn: number; total: number } }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(issueByScan, {} as { error?: string; success?: string });

  const [bookHit, setBookHit] = useState<ScanHit | null>(null);
  const [borrowerHit, setBorrowerHit] = useState<ScanHit | null>(null);
  const [looking, setLooking] = useState<"book" | "borrower" | null>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const borrowerRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // A scanner fires the moment the panel opens, so the book field must already
  // have focus or the first few characters are lost to nothing.
  useEffect(() => { if (open) bookRef.current?.focus(); }, [open]);

  // Clear the fields after a successful issue so the next book can be scanned
  // straight away — a counter does these in a run, not one at a time.
  useEffect(() => {
    if (state?.success) {
      setBookHit(null); setBorrowerHit(null);
      formRef.current?.reset();
      bookRef.current?.focus();
    }
  }, [state?.success]);

  async function lookup(which: "book" | "borrower", value: string) {
    const set = which === "book" ? setBookHit : setBorrowerHit;
    if (!value.trim()) { set(null); return; }
    setLooking(which);
    const hit = await resolveScanCode(value);
    set(hit);
    setLooking(null);
    // A keyboard-wedge scanner ends with Enter, so hand focus onward the way a
    // person working a queue would expect.
    if (which === "book" && hit.kind === "book") borrowerRef.current?.focus();
  }

  const ready = bookHit?.kind === "book" && borrowerHit?.kind === "borrower" && bookHit.available > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        <ScanLine size={16} aria-hidden /> Scan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 bg-slate-900/40 backdrop-blur-sm"
             onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine size={16} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Scan to issue</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                      className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form ref={formRef} action={action} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="scan-book">
                  Book — scan the barcode on the spine
                </label>
                <input
                  ref={bookRef} id="scan-book" name="bookCode" autoComplete="off"
                  placeholder="ISBN or catalogue id"
                  className={field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); lookup("book", e.currentTarget.value); }
                  }}
                  onBlur={(e) => lookup("book", e.currentTarget.value)}
                />
                {looking === "book"
                  ? <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Looking up…</p>
                  : <Hit hit={bookHit} expecting="book" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="scan-borrower">
                  Borrower — scan the student ID card
                </label>
                <input
                  ref={borrowerRef} id="scan-borrower" name="borrowerCode" autoComplete="off"
                  placeholder="Registration number, or staff email"
                  className={field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); lookup("borrower", e.currentTarget.value); }
                  }}
                  onBlur={(e) => lookup("borrower", e.currentTarget.value)}
                />
                {looking === "borrower"
                  ? <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Looking up…</p>
                  : <Hit hit={borrowerHit} expecting="borrower" />}
              </div>

              {state?.error && <p className="text-xs text-rose-600 dark:text-rose-400">{state.error}</p>}
              {state?.success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>}

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-slate-400">Loans run {LOAN_DAYS} days.</p>
                <button type="submit" disabled={!ready || pending}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                  {pending ? "Issuing…" : "Issue book"}
                </button>
              </div>
            </form>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 space-y-2">
              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>
                  A USB or Bluetooth barcode scanner types what it reads and presses Enter, so it works
                  here now — no setup. <b>Camera scanning from a phone or webcam is not built yet.</b>
                </span>
              </p>
              {isbnCoverage.withIsbn < isbnCoverage.total && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  <span>
                    Only {isbnCoverage.withIsbn} of {isbnCoverage.total} titles have an ISBN on file, so most
                    books cannot be scanned by their printed barcode yet. Add ISBNs when cataloguing, or print
                    your own labels encoding the catalogue id.
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
