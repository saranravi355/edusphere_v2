"use client";

import { UserPlus } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { logClinicVisit } from "./actions";

const field =
  "w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function VisitModal({
  students,
}: {
  students: { id: string; name: string; classroom: string; allergies: string | null }[];
}) {
  return (
    <FormModal
      title="Log Clinic Visit"
      description="Goes into the student's health record."
      buttonText="Log New Visit"
      buttonIcon={<UserPlus size={18} aria-hidden />}
      submitLabel="Log visit"
      pendingLabel="Logging…"
      action={logClinicVisit}
    >
      <div>
        <label className={label} htmlFor="cv-student">Student</label>
        <select id="cv-student" name="studentId" required defaultValue="" className={field}>
          <option value="" disabled>Select a student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.classroom}{s.allergies ? ` · allergies: ${s.allergies}` : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Any recorded allergies are shown next to the name.
        </p>
      </div>

      <div>
        <label className={label} htmlFor="cv-reason">Reason / symptoms</label>
        <input id="cv-reason" name="reason" type="text" required placeholder="e.g. Headache, fever" className={field} />
      </div>

      <div>
        <label className={label} htmlFor="cv-treatment">Treatment administered</label>
        <input id="cv-treatment" name="treatment" type="text" required placeholder="e.g. Paracetamol 250mg, ice pack" className={field} />
      </div>

      <div>
        <label className={label} htmlFor="cv-notes">Additional notes</label>
        <textarea id="cv-notes" name="notes" rows={3} placeholder="Optional — sent home, parent called, follow-up needed…" className={field} />
      </div>
    </FormModal>
  );
}
