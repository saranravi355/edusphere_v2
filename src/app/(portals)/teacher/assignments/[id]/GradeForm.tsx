"use client";

import { useActionState } from "react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { gradeSubmission } from "../actions";

export default function GradeForm({ submissionId, current }: { submissionId: string; current: number | null }) {
  const [state, formAction] = useActionState(gradeSubmission, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-1.5 items-end">
      <div className="flex items-center gap-2">
        <input type="hidden" name="submissionId" value={submissionId} />
        <label className="sr-only" htmlFor={`grade-${submissionId}`}>IB grade, 1 to 7</label>
        <input
          id={`grade-${submissionId}`}
          name="grade"
          type="number"
          min={1}
          max={7}
          step={1}
          defaultValue={current ?? ""}
          placeholder="1-7"
          className="w-20 p-1.5 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-300"
        />
        <SubmitButton size="sm" pendingText="Saving…" variant="subtle">Save</SubmitButton>
      </div>
      <FormFeedback state={state} className="text-xs py-1" />
    </form>
  );
}
