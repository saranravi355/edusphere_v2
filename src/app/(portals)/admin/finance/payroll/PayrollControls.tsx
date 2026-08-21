"use client";

import { useActionState } from "react";
import { Play, IndianRupee, Banknote } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import FormModal from "@/components/ui/FormModal";
import { runPayroll, disburse, setSalary } from "./actions";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export default function PayrollControls({
  period,
  status,
  teachers,
  hasLines,
}: {
  period: string;
  status: "NONE" | "DRAFT" | "DISBURSED";
  teachers: { id: string; name: string; baseSalary: number | null }[];
  hasLines: boolean;
}) {
  const [runState, runAction] = useActionState(runPayroll, undefined);
  const [payState, payAction] = useActionState(disburse, undefined);

  const unpriced = teachers.filter((t) => !t.baseSalary).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={runAction}>
          <input type="hidden" name="period" value={period} />
          <SubmitButton pendingText="Calculating…" disabled={status === "DISBURSED"}>
            <Play size={16} aria-hidden /> {status === "NONE" ? "Run payroll" : "Recalculate"}
          </SubmitButton>
        </form>

        <form action={payAction}>
          <input type="hidden" name="period" value={period} />
          <SubmitButton variant="subtle" pendingText="Recording…" disabled={status !== "DRAFT" || !hasLines}>
            <Banknote size={16} aria-hidden /> Mark disbursed
          </SubmitButton>
        </form>

        <FormModal
          title="Set a monthly salary"
          description="Payroll can only include staff who have one."
          buttonText="Salaries"
          buttonIcon={<IndianRupee size={16} aria-hidden />}
          buttonClassName="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
          submitLabel="Save salary"
          pendingLabel="Saving…"
          action={setSalary}
        >
          <div>
            <label className={label} htmlFor="pr-teacher">Member of staff</label>
            <select id="pr-teacher" name="teacherId" required defaultValue="" className={field}>
              <option value="" disabled>Select…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.baseSalary ? ` — ₹${t.baseSalary.toLocaleString("en-IN")}` : " — not set"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pr-salary">Monthly gross (₹)</label>
            <input id="pr-salary" name="baseSalary" required type="number" min={0} step={100} className={field} />
          </div>
        </FormModal>
      </div>

      <FormFeedback state={runState} />
      <FormFeedback state={payState} />

      {unpriced > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {unpriced} of {teachers.length} staff have no salary on record and are left out of the run.
        </p>
      )}
    </div>
  );
}
