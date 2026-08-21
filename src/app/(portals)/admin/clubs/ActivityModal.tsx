"use client";

import { CalendarPlus } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { addClubActivity } from "./actions";
import { CLUB_ACTIVITY_TYPES, prettyOption } from "@/lib/options";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function ActivityModal({
  clubs,
  defaultClubId,
}: {
  clubs: { id: string; name: string }[];
  defaultClubId?: string;
}) {
  return (
    <FormModal
      title="Schedule club activity"
      description="Members are notified when it is saved."
      buttonText="Add activity"
      buttonIcon={<CalendarPlus size={16} aria-hidden />}
      submitLabel="Schedule it"
      pendingLabel="Scheduling…"
      action={addClubActivity}
    >
      <div>
        <label className={label} htmlFor="ca-club">Club</label>
        <select id="ca-club" name="clubId" required defaultValue={defaultClubId ?? ""} className={field}>
          <option value="" disabled>Select a club…</option>
          {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="ca-title">Title</label>
        <input id="ca-title" name="title" required type="text" placeholder="e.g. Inter-school debate heats" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="ca-type">Type</label>
          <select id="ca-type" name="type" required defaultValue="MEETING" className={field}>
            {CLUB_ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{prettyOption(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ca-date">Date</label>
          <input id="ca-date" name="date" required type="date" className={field} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="ca-location">Location (optional)</label>
        <input id="ca-location" name="location" type="text" placeholder="e.g. Main auditorium" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="ca-description">Details (optional)</label>
        <textarea id="ca-description" name="description" rows={3} className={field} placeholder="What members should know or bring." />
      </div>
    </FormModal>
  );
}
