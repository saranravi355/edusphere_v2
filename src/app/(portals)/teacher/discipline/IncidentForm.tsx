"use client";

import { useActionState, useState } from "react";
import { ShieldAlert, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { logTeacherIncident } from "./actions";
import { MERIT_CATEGORIES, DEMERIT_CATEGORIES } from "@/lib/behavior";

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function IncidentForm({
  students,
}: {
  students: { id: string; name: string; classroom: string }[];
}) {
  const [state, action] = useActionState(logTeacherIncident, undefined);
  const [type, setType] = useState<"MERIT" | "DEMERIT">("DEMERIT");

  const categories = type === "MERIT" ? MERIT_CATEGORIES : DEMERIT_CATEGORIES;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <ShieldAlert size={18} className="text-purple-500" aria-hidden />
        Log new incident
      </h3>

      <form action={action} className="space-y-4">
        <div>
          <label className={label} htmlFor="di-student">Student</label>
          <select id="di-student" name="studentId" required defaultValue="" className={field}>
            <option value="" disabled>Select from your classes…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.classroom}</option>)}
          </select>
          {students.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              You have no classes assigned, so there is nobody to log against yet.
            </p>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Incident type</span>
          <div className="flex gap-2" role="group" aria-label="Incident type">
            <button
              type="button"
              aria-pressed={type === "MERIT"}
              onClick={() => setType("MERIT")}
              className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${type === "MERIT" ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400" : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
            >
              <ThumbsUp size={16} aria-hidden /> Merit
            </button>
            <button
              type="button"
              aria-pressed={type === "DEMERIT"}
              onClick={() => setType("DEMERIT")}
              className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${type === "DEMERIT" ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400" : "border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
            >
              <ThumbsDown size={16} aria-hidden /> Demerit
            </button>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="di-category">Behaviour category</label>
          {/* Keyed on type so switching resets the selection instead of
              submitting a merit category with a demerit selected. */}
          <select key={type} id="di-category" name="category" required defaultValue="" className={field}>
            <option value="" disabled>Select a category…</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} ({c.type === "MERIT" ? "+" : "−"}{c.points} pts)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="di-description">What happened</label>
          <textarea id="di-description" name="description" required rows={3} className={field} placeholder="Describe the incident…" />
          <p className="text-xs text-slate-400 mt-1">
            Kept on the student&apos;s conduct record and shown to their parents.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="notifyParent" defaultChecked className="mt-0.5" />
          Notify the parent
        </label>

        <FormFeedback state={state} />

        <SubmitButton className="w-full" pendingText="Logging…" disabled={students.length === 0}>
          <Send size={16} aria-hidden /> Submit log
        </SubmitButton>
      </form>
    </div>
  );
}
