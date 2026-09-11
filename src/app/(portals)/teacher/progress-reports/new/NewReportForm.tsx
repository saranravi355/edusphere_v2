"use client";

import { useActionState } from "react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { createDraft } from "../actions";

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function NewReportForm({ studentId, defaultYear }: { studentId: string; defaultYear: string }) {
  const [state, action] = useActionState(createDraft, undefined);

  return (
    <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <label className={label} htmlFor="npr-term">Term</label>
        <select id="npr-term" name="term" required defaultValue="Term 1" className={field}>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="npr-year">Academic year</label>
        <input id="npr-year" name="academicYear" required defaultValue={defaultYear} placeholder="2026-2027" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="npr-grade">Grade (optional)</label>
        <input id="npr-grade" name="grade" placeholder="Grade 1" className={field} />
      </div>
      <FormFeedback state={state} />
      <SubmitButton className="w-full" pendingText="Creating…">Continue</SubmitButton>
    </form>
  );
}
