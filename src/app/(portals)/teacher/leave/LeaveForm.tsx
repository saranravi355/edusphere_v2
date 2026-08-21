"use client";

import { useActionState } from "react";
import { FileText } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { requestLeave } from "./actions";
import { LEAVE_TYPES } from "@/lib/leave";

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function LeaveForm({ colleagues }: { colleagues: { id: string; name: string }[] }) {
  const [state, action] = useActionState(requestLeave, undefined);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <FileText size={18} className="text-blue-500" aria-hidden />
        New request
      </h3>

      <form action={action} className="space-y-4">
        <div>
          <label className={label} htmlFor="lv-type">Leave type</label>
          <select id="lv-type" name="leaveType" required defaultValue="CASUAL" className={field}>
            {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="lv-from">From</label>
            <input id="lv-from" name="startDate" required type="date" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="lv-to">To</label>
            <input id="lv-to" name="endDate" required type="date" className={field} />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="lv-reason">Reason</label>
          <textarea id="lv-reason" name="reason" required rows={3} className={field} placeholder="The Principal reads this when deciding." />
        </div>

        <div>
          <label className={label} htmlFor="lv-sub">Substitute teacher (optional)</label>
          <select id="lv-sub" name="substituteTeacherId" defaultValue="" className={field}>
            <option value="">No preference</option>
            {colleagues.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Naming a colleague is a request, not a booking — cover is confirmed when the leave is approved.
          </p>
        </div>

        <FormFeedback state={state} />

        <SubmitButton className="w-full" pendingText="Submitting…">Submit request</SubmitButton>
      </form>
    </div>
  );
}
