"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Shared form primitives.
 *
 * Before these existed, no form in the app had a pending state: every submit
 * button stayed enabled while the server action ran, so a double click fired
 * the mutation twice, and a failed action returned `{ error }` that nothing
 * rendered. These components fix both classes of problem once, for every form,
 * rather than per screen.
 */

/** What every server action in this app returns. */
export type ActionState = { error?: string; success?: string } | undefined;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium " +
  "transition-colors disabled:opacity-60 disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-slate-800 dark:focus-visible:ring-slate-300";

const VARIANTS = {
  primary: "bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600",
  danger: "bg-rose-600 hover:bg-rose-700 text-white",
  subtle:
    "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200",
} as const;

/**
 * Submit button that disables itself while its form is submitting.
 * Must be rendered inside the <form> it submits — that is how useFormStatus
 * finds it.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className = "",
  size = "md",
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "disabled">) {
  const { pending } = useFormStatus();
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5";
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${BASE} ${VARIANTS[variant]} ${pad} ${className}`}
      {...rest}
    >
      {pending && <Loader2 size={size === "sm" ? 13 : 16} className="animate-spin" aria-hidden />}
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}

/**
 * Destructive submit. First click arms and asks; second click submits.
 * Escape or Cancel disarms. Nothing is deleted on a single stray click.
 */
export function ConfirmSubmitButton({
  children,
  confirmLabel = "Confirm",
  question = "Are you sure?",
  pendingText = "Deleting…",
  className = "",
  size = "sm",
  triggerClassName,
  triggerLabel,
}: {
  children: React.ReactNode;
  confirmLabel?: string;
  question?: string;
  pendingText?: string;
  className?: string;
  size?: "sm" | "md";
  /** Keep an existing icon-button style for the un-armed trigger. */
  triggerClassName?: string;
  /** Accessible name, required when the trigger is icon-only. */
  triggerLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setArmed(false); };
    const onClickAway = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setArmed(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [armed]);

  // No effect needed to un-arm on submit: the `pending` branch below renders
  // ahead of the armed branch, so progress is shown while the action runs, and
  // the row itself normally unmounts once the delete succeeds.

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5";

  if (pending) {
    return (
      <span className={`${BASE} ${VARIANTS.danger} ${pad} ${className}`} aria-live="polite">
        <Loader2 size={13} className="animate-spin" aria-hidden /> {pendingText}
      </span>
    );
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={triggerLabel}
        className={triggerClassName ?? `${BASE} ${VARIANTS.subtle} ${pad} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span ref={wrapRef} className="inline-flex items-center gap-2" role="group" aria-label={question}>
      <span className="text-xs text-slate-600 dark:text-slate-300">{question}</span>
      <button type="submit" autoFocus className={`${BASE} ${VARIANTS.danger} ${pad}`}>
        {confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className={`${BASE} ${VARIANTS.subtle} ${pad}`}>
        Cancel
      </button>
    </span>
  );
}

/** Renders whatever a server action returned. Announced to screen readers. */
export function FormFeedback({ state, className = "" }: { state: ActionState; className?: string }) {
  if (!state?.error && !state?.success) return null;
  const isError = Boolean(state.error);
  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={
        `flex items-start gap-2 text-sm rounded-md px-3 py-2 border ${className} ` +
        (isError
          ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
          : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900")
      }
    >
      {isError ? <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
               : <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />}
      <span>{state.error ?? state.success}</span>
    </p>
  );
}


/**
 * Destructive action outside a <form> — arms, confirms, then runs an async
 * callback with its own pending and error state. Replaces the
 * `startTransition(() => deleteThing(id).then(() => {}))` pattern, which had no
 * confirmation and dropped any rejection on the floor.
 */
export function ConfirmIconButton({
  onConfirm,
  question,
  confirmLabel = "Delete",
  triggerLabel,
  triggerClassName,
  children,
}: {
  onConfirm: () => Promise<{ error?: string; success?: boolean } | void>;
  question: string;
  confirmLabel?: string;
  triggerLabel: string;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setArmed(false); };
    const away = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setArmed(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", away);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", away);
    };
  }, [armed]);

  async function run() {
    if (busy) return;              // guards the double click
    setBusy(true); setError(null);
    try {
      const res = await onConfirm();
      if (res && "error" in res && res.error) setError(res.error);
      else setArmed(false);
    } catch {
      setError("Could not complete that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-2">
        <span role="alert" className="text-[11px] text-red-600 dark:text-red-400">{error}</span>
        <button type="button" onClick={() => { setError(null); setArmed(true); }}
          className="text-[11px] underline text-slate-500 hover:text-slate-700">Retry</button>
      </span>
    );
  }

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500" aria-live="polite">
        <Loader2 size={12} className="animate-spin" aria-hidden /> Deleting…
      </span>
    );
  }

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} aria-label={triggerLabel}
        className={triggerClassName ?? `${BASE} ${VARIANTS.subtle} px-3 py-1.5 text-xs`}>
        {children}
      </button>
    );
  }

  return (
    <span ref={wrapRef} className="inline-flex items-center gap-1.5" role="group" aria-label={question}>
      <span className="text-[11px] text-slate-600 dark:text-slate-300">{question}</span>
      <button type="button" autoFocus onClick={run}
        className={`${BASE} ${VARIANTS.danger} px-2.5 py-1 text-[11px]`}>{confirmLabel}</button>
      <button type="button" onClick={() => setArmed(false)}
        className={`${BASE} ${VARIANTS.subtle} px-2.5 py-1 text-[11px]`}>Cancel</button>
    </span>
  );
}
