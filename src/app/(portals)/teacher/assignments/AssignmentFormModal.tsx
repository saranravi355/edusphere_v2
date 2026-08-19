"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { createAssignment, updateAssignment } from "./actions";

type Option = { id: string; name: string };
export type AssignmentDraft = {
  id: string; title: string; description: string;
  subjectId: string; classroomId: string; dueDate: string; // yyyy-mm-dd
};

/**
 * Create / edit an assignment. Replaces a modal that had no <form>, no name
 * attributes and no action at all — its inputs were decorative, and its class
 * list was hardcoded to "10A"/"10B", which are not classes this school has.
 */
export default function AssignmentFormModal({
  classes, subjects, assignment, trigger,
}: {
  classes: Option[];
  subjects: Option[];
  assignment?: AssignmentDraft;
  trigger?: React.ReactNode;
}) {
  const editing = Boolean(assignment);
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(editing ? updateAssignment : createAssignment, undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  // Close on success, and hand focus back to whatever opened the dialog.
  useEffect(() => {
    if (state?.success && open) {
      const t = setTimeout(() => { setOpen(false); openerRef.current?.focus(); }, 700);
      return () => clearTimeout(t);
    }
  }, [state?.success, open]);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const field = "w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-300";
  const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <>
      <button
        ref={openerRef}
        onClick={() => setOpen(true)}
        className={trigger
          ? "flex-1 text-center py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          : "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"}
      >
        {trigger ?? (<><Plus size={16} aria-hidden /> Create Assignment</>)}
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
            aria-labelledby="assignment-dialog-title"
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 id="assignment-dialog-title" className="font-bold text-lg text-navy-900 dark:text-slate-100">
                {editing ? "Edit Assignment" : "Create Assignment"}
              </h3>
              <button onClick={() => setOpen(false)} aria-label="Close dialog"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800">
                <X size={20} aria-hidden />
              </button>
            </div>

            <form action={formAction} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 text-left overflow-y-auto">
                {editing && <input type="hidden" name="id" value={assignment!.id} />}

                <div>
                  <label className={label} htmlFor="af-title">Title</label>
                  <input ref={firstFieldRef} id="af-title" name="title" type="text" required maxLength={120}
                    defaultValue={assignment?.title} placeholder="e.g. Chapter 4 problem set" className={field} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={label} htmlFor="af-class">Class</label>
                    <select id="af-class" name="classroomId" required defaultValue={assignment?.classroomId ?? ""} className={field}>
                      <option value="" disabled>Choose a class…</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="af-subject">Subject</label>
                    <select id="af-subject" name="subjectId" required defaultValue={assignment?.subjectId ?? ""} className={field}>
                      <option value="" disabled>Choose a subject…</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={label} htmlFor="af-due">Due date</label>
                  <input id="af-due" name="dueDate" type="date" required defaultValue={assignment?.dueDate} className={field} />
                  <p className="text-xs text-slate-400 mt-1">Due at the end of this day.</p>
                </div>

                <div>
                  <label className={label} htmlFor="af-desc">Description</label>
                  <textarea id="af-desc" name="description" required maxLength={4000}
                    defaultValue={assignment?.description} placeholder="What should students do?"
                    className={`${field} h-24 resize-none`} />
                </div>

                <FormFeedback state={state} />
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <SubmitButton pendingText={editing ? "Saving…" : "Creating…"}>
                  {editing ? "Save changes" : "Create assignment"}
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
