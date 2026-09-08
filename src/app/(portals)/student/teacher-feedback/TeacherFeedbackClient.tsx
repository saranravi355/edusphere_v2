"use client";

import { useActionState, useState } from "react";
import { User, MessageSquareText, CheckCircle2, ChevronDown } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { submitTeacherFeedback } from "./actions";
import StarRating from "./StarRating";

type Teacher = { id: string; name: string; subject: string | null };
type Existing = {
  classConductRating: number;
  explanationRating: number;
  communicationRating: number;
  supportRating: number;
  comment: string | null;
  updatedAt: string;
};

const QUESTIONS = [
  { field: "classConductRating", label: "How does this teacher conduct classes?" },
  { field: "explanationRating", label: "How clearly do they explain concepts?" },
  { field: "communicationRating", label: "How well do they communicate with you?" },
  { field: "supportRating", label: "How supportive are they when you need help?" },
] as const;

function TeacherCard({ teacher, existing }: { teacher: Teacher; existing?: Existing }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitTeacherFeedback, undefined);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <User size={17} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{teacher.name}</p>
            {teacher.subject && <p className="text-[11px] text-slate-400">{teacher.subject}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {existing && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={11} /> Submitted
            </span>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <form action={action} className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-zinc-800 space-y-4">
          <input type="hidden" name="teacherId" value={teacher.id} />

          {QUESTIONS.map((q) => (
            <div key={q.field} className="flex items-center justify-between gap-4">
              <label className="text-sm text-slate-700 dark:text-slate-300">{q.label}</label>
              <StarRating name={q.field} defaultValue={existing?.[q.field] ?? 0} />
            </div>
          ))}

          <div>
            <label htmlFor={`comment-${teacher.id}`} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <MessageSquareText size={13} /> Comment (optional)
            </label>
            <textarea
              id={`comment-${teacher.id}`}
              name="comment"
              rows={3}
              maxLength={2000}
              defaultValue={existing?.comment ?? ""}
              placeholder="Anything specific you'd like this teacher to know?"
              className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <FormFeedback state={state} />

          <SubmitButton pendingText="Sending…">
            {existing ? "Update feedback" : "Send feedback"}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export default function TeacherFeedbackClient({
  teachers,
  feedbackByTeacher,
}: {
  teachers: Teacher[];
  feedbackByTeacher: Record<string, Existing>;
}) {
  if (teachers.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        No teachers are linked to your class yet — check back once your timetable is set.
      </div>
    );
  }

  const submittedCount = teachers.filter((t) => feedbackByTeacher[t.id]).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        {submittedCount} of {teachers.length} teacher{teachers.length === 1 ? "" : "s"} rated
      </p>
      {teachers.map((t) => (
        <TeacherCard key={t.id} teacher={t} existing={feedbackByTeacher[t.id]} />
      ))}
    </div>
  );
}
