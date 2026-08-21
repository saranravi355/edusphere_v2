"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SubmitButton, FormFeedback, type ActionState } from "@/components/ui/form";

/**
 * A dialog whose only job is to submit one server action.
 *
 * This exists because the generic `Modal` used to render its own footer with a
 * prominent blue "Save" that called `alert("Data successfully submitted!")` and
 * closed. Five screens used it. On two of them nothing else was wired up at
 * all, so every incident and every clinic visit staff thought they had logged
 * was discarded; on the third there was a real submit button inside the body,
 * and the fake Save sat below it looking more like the primary action, so
 * hitting the obvious button threw the work away and said it had worked.
 *
 * Everything a form dialog needs is here once: pending state, the action's own
 * error or success message, closing only after the action actually succeeded,
 * Escape, click-outside, a focus trap and focus restored to the trigger.
 */
export default function FormModal({
  title,
  description,
  buttonText,
  buttonIcon,
  buttonClassName,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  action,
  children,
}: {
  title: string;
  description?: string;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  buttonClassName?: string;
  submitLabel?: string;
  pendingLabel?: string;
  /** Must return `{ error }` or `{ success }` — see ActionState. */
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Closing happens here rather than in an effect watching `state`: this runs
  // once, when the action resolves, instead of on every render that carries a
  // success. A failed save leaves the dialog open with the typed values in it.
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, undefined);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    )?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={openerRef}
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
        }
      >
        {buttonIcon}
        {buttonText}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(e) => { if (!panelRef.current?.contains(e.target as Node)) setOpen(false); }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-navy-900 dark:text-slate-100">{title}</h3>
                {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto space-y-4">
                {children}
                <FormFeedback state={state} />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton pendingText={pendingLabel}>{submitLabel}</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
