"use client";

import { Plus } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { logIncident } from "./actions";
import { MERIT_CATEGORIES, DEMERIT_CATEGORIES } from "@/lib/behavior";

const field =
  "w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function IncidentModal({
  students,
  teachers,
}: {
  students: { id: string; name: string; classroom: string }[];
  teachers: { id: string; name: string }[];
}) {
  return (
    <FormModal
      title="Log Behaviour Incident"
      description="Recorded against the student's conduct record and visible to their parents."
      buttonText="Log Incident"
      buttonIcon={<Plus size={16} aria-hidden />}
      submitLabel="Log incident"
      pendingLabel="Logging…"
      action={logIncident}
    >
      <div>
        <label className={label} htmlFor="bi-student">Student</label>
        <select id="bi-student" name="studentId" required defaultValue="" className={field}>
          <option value="" disabled>Select a student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.classroom}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="bi-type">Type</label>
          <select id="bi-type" name="type" required defaultValue="MERIT" className={field}>
            <option value="MERIT">Merit (positive)</option>
            <option value="DEMERIT">Demerit (negative)</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="bi-points">Points</label>
          <input id="bi-points" name="points" type="number" min={1} max={20} defaultValue={5} required className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="bi-category">Category</label>
        <select id="bi-category" name="category" required defaultValue="" className={field}>
          <option value="" disabled>Select a category…</option>
          <optgroup label="Merit">
            {MERIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} (+{c.points})</option>)}
          </optgroup>
          <optgroup label="Demerit">
            {DEMERIT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} (−{c.points})</option>)}
          </optgroup>
        </select>
      </div>

      <div>
        <label className={label} htmlFor="bi-teacher">Reported by</label>
        <select id="bi-teacher" name="teacherId" required defaultValue="" className={field}>
          <option value="" disabled>Select a member of staff…</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="bi-description">What happened</label>
        <textarea
          id="bi-description"
          name="description"
          rows={3}
          required
          placeholder="Describe the incident in the words you would use to the student's parents."
          className={field}
        />
      </div>
    </FormModal>
  );
}
