"use client";

import { useState } from "react";
import { Users, AlertTriangle, Megaphone } from "lucide-react";
import { onboardTeacher, createAnnouncement } from "@/app/(portals)/admin/actions";
import FormModal from "@/components/ui/FormModal";
import type { ActionState } from "@/components/ui/form";

const field =
  "mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg " +
  "px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-slate-100";
const label = "text-sm font-medium text-slate-700 dark:text-slate-300";

const tile =
  "w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow group";

/**
 * `onboardTeacher` predates the shared ActionState convention and returns
 * `{ success: true }`. Wrapping it here keeps FormModal's contract — pending
 * state, a message, close only on success — without changing the action's
 * signature for its other caller.
 */
async function onboardTeacherWithMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const res = await onboardTeacher(formData);
  if (res && "error" in res && res.error) return { error: res.error };
  const who = String(formData.get("name") ?? "The teacher");
  const temp = res && "tempPassword" in res ? res.tempPassword : undefined;
  // The dialog is told to stay open (keepOpenOnSuccess) precisely so this can
  // be read and written down. It is shown once and stored nowhere.
  return {
    success: temp
      ? `${who} now has a portal account. One-time password: ${temp} — write it down now, it is not shown again. They will be asked to choose their own on first sign-in.`
      : `${who} now has a portal account.`,
  };
}

export default function AdminActionModals() {
  const [audienceTouched, setAudienceTouched] = useState(false);

  return (
    <div className="space-y-4 mt-2">
      <FormModal
        title="Onboard Teacher"
        description="Creates the staff record and a portal login."
        buttonText="Onboard New Teacher"
        buttonIcon={<Users className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden />}
        buttonClassName={`${tile} bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-900/30 dark:hover:bg-purple-900/40 dark:text-purple-300 flex-row-reverse justify-between`}
        submitLabel="Create teacher profile"
        pendingLabel="Creating…"
        action={onboardTeacherWithMessage}
        keepOpenOnSuccess
      >
        <div>
          <label className={label} htmlFor="ot-name">Full name</label>
          <input id="ot-name" required name="name" type="text" placeholder="Anita Sharma" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ot-email">Email address</label>
          <input id="ot-email" required name="email" type="email" placeholder="anita.sharma@edusphere.com" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ot-subjects">Subjects</label>
          <input id="ot-subjects" required name="subjects" type="text" placeholder="Mathematics, Physics" className={field} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          They sign in with the school&apos;s starter password and are prompted to change it.
        </p>
      </FormModal>

      <FormModal
        title="Broadcast Announcement"
        description="Saved to the school record and delivered to each recipient's notifications."
        buttonText="School-Wide Announcement"
        buttonIcon={<AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden />}
        buttonClassName={`${tile} bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:hover:bg-blue-900/40 dark:text-blue-300 flex-row-reverse justify-between`}
        submitLabel="Send announcement"
        pendingLabel="Sending…"
        action={createAnnouncement}
      >
        <div>
          <label className={label} htmlFor="an-title">Subject</label>
          <input id="an-title" required name="title" type="text" placeholder="Half-term closure: 20–24 October" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="an-message">Message</label>
          <textarea id="an-message" required name="message" rows={4} placeholder="Type your announcement here…" className={`${field} resize-none`} />
        </div>
        <fieldset onChange={() => setAudienceTouched(true)}>
          <legend className={label}>Send to</legend>
          {/*
            These checkboxes had no name attribute, so nothing they said ever
            left the browser. They decide the audience now.
          */}
          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyTeachers" defaultChecked /> Teachers
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyParents" defaultChecked /> Parents
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="notifyStudents" /> Students
            </label>
          </div>
          {audienceTouched && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Megaphone size={12} aria-hidden /> Everyone selected gets a notification in their portal.
            </p>
          )}
        </fieldset>
      </FormModal>
    </div>
  );
}
