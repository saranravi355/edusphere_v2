"use client";

import { useActionState, useState } from "react";
import { changePassword } from "./actions";
import { LogoFull } from "@/components/ui/Logo";
import { Check, X } from "lucide-react";

const INPUT =
  "w-full px-3 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded-md " +
  "focus:border-slate-800 focus:ring-1 focus:ring-slate-800 dark:focus:border-slate-400 " +
  "dark:focus:ring-slate-400 outline-none transition-all text-slate-800 dark:text-slate-200 " +
  "placeholder:text-slate-400 text-sm";

/**
 * Live rules, checked in the browser purely so the person is not guessing. The
 * server checks the same things again in `passwordProblem` and is the one that
 * decides — this is a courtesy, not a gate.
 */
function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
      {met ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </li>
  );
}

export default function ChangePasswordForm({
  name,
  firstTime,
}: {
  name: string;
  firstTime: boolean;
}) {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const longEnough = next.length >= 10;
  const notTheOldOne = next.length > 0 && next.toLowerCase().replace(/[^a-z0-9]/g, "") !== "password123";
  const matches = next.length > 0 && next === confirm;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-200 dark:bg-slate-950 p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 sm:p-10">
        <div className="flex justify-center mb-6">
          <LogoFull className="h-24 w-auto object-contain" />
        </div>

        <h1 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {firstTime ? "Choose your password" : "Change your password"}
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-3 leading-relaxed">
          {firstTime ? (
            <>
              Hello {name}. Your account still has the password it was set up
              with, and so did everyone else&rsquo;s. Please choose one only you
              know before going any further.
            </>
          ) : (
            <>Choose a new password for your account, {name}.</>
          )}
        </p>

        <form action={formAction} className="flex flex-col gap-4 mt-7">
          <input
            type="password"
            name="currentPassword"
            placeholder={firstTime ? "Current password" : "Current password"}
            autoComplete="current-password"
            className={INPUT}
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={INPUT}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="New password again"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT}
            required
          />

          <ul className="text-xs space-y-1.5 mt-1">
            <Rule met={longEnough}>At least 10 characters</Rule>
            <Rule met={notTheOldOne}>Not the password you were given</Rule>
            <Rule met={matches}>Both new entries match</Rule>
          </ul>

          {state?.error && (
            <p
              role="alert"
              className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 mt-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-md transition-colors text-sm shadow-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Save and continue"}
          </button>
        </form>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
          A phrase you will remember — three or four unrelated words — is both
          easier to type and harder to guess than a short jumble.
        </p>
      </div>
    </div>
  );
}
