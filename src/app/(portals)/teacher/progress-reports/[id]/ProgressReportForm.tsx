"use client";

import { useActionState, useState } from "react";
import { ChevronDown, FileDown, Save, Sparkles } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { submitReport } from "../actions";
import {
  SUBJECTS,
  ATL_GROUPS,
  LEARNER_PROFILE,
  UOI_CRITERIA,
  UOI_COUNT,
  RATING_SCALE,
  type ProgressReportData,
} from "@/lib/progressReport";

const field =
  "w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black " +
  "text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";
const label = "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1";

function RatingSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black w-24 shrink-0">
      <option value="">—</option>
      {RATING_SCALE.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
    </select>
  );
}

function RatingRow({ name, criterion, defaultValue }: { name: string; criterion: string; defaultValue: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{criterion}</span>
      <RatingSelect name={name} defaultValue={defaultValue} />
    </div>
  );
}

function Section({ title, subtitle, defaultOpen, children }: { title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <div>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function ProgressReportForm({
  reportId,
  data,
  pdfUrl,
  status,
}: {
  reportId: string;
  data: ProgressReportData;
  pdfUrl: string | null;
  status: string;
}) {
  const [state, action] = useActionState(submitReport, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reportId" value={reportId} />

      {status === "GENERATED" && pdfUrl && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">This report has already been generated.</p>
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white">
            <FileDown size={13} /> View current PDF
          </a>
        </div>
      )}

      <Section title="Overview" subtitle="Homeroom teacher name and the letter printed at the top of the report" defaultOpen>
        <div>
          <label className={label} htmlFor="pr-hrt">Homeroom teacher name</label>
          <input id="pr-hrt" name="homeroomTeacherName" defaultValue={data.homeroomTeacherName} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="pr-intro">Letter to parents</label>
          <textarea id="pr-intro" name="introLetter" rows={4} defaultValue={data.introLetter} className={field} />
        </div>
      </Section>

      {Array.from({ length: UOI_COUNT }, (_, i) => {
        const u = data.unitsOfInquiry[i];
        return (
          <Section key={i} title={`Unit of Inquiry ${i + 1}`} subtitle={u.theme || "Not started"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor={`u-${i}-theme`}>Theme</label>
                <input id={`u-${i}-theme`} name={`unit_${i}_theme`} defaultValue={u.theme} className={field} />
              </div>
              <div>
                <label className={label} htmlFor={`u-${i}-central`}>Central idea</label>
                <input id={`u-${i}-central`} name={`unit_${i}_centralIdea`} defaultValue={u.centralIdea} className={field} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor={`u-${i}-inq`}>An inquiry into (one per line)</label>
              <textarea id={`u-${i}-inq`} name={`unit_${i}_inquiryPoints`} rows={3} defaultValue={u.inquiryPoints.join("\n")} className={field} />
            </div>
            <div className="pt-1">
              {UOI_CRITERIA.map((c, ci) => (
                <RatingRow key={ci} name={`unit_${i}_rating_${ci}`} criterion={c} defaultValue={u.ratings[ci] ?? ""} />
              ))}
            </div>
            <div>
              <label className={label} htmlFor={`u-${i}-comment`}>Teacher's comment</label>
              <textarea id={`u-${i}-comment`} name={`unit_${i}_comment`} rows={4} defaultValue={u.comment} className={field} />
            </div>
          </Section>
        );
      })}

      {SUBJECTS.map((s) => {
        const ans = data.subjects[s.key];
        let idx = 0;
        return (
          <Section key={s.key} title={s.name} subtitle={ans.overall ? `Overall: ${ans.overall}` : "Not started"}>
            {s.strands.map((strand, si) => (
              <div key={si}>
                {strand.name && <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mt-2 mb-1">{strand.name}</p>}
                {strand.items.map((item) => {
                  const i = idx++;
                  return <RatingRow key={i} name={`subject_${s.key}_item_${i}`} criterion={item} defaultValue={ans.itemRatings[i] ?? ""} />;
                })}
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Performance in {s.name}</span>
              <RatingSelect name={`subject_${s.key}_overall_single_0`} defaultValue={ans.overall} />
            </div>
            <div>
              <label className={label} htmlFor={`s-${s.key}-comment`}>Teacher's comment</label>
              <textarea id={`s-${s.key}-comment`} name={`subject_${s.key}_comment`} rows={4} defaultValue={ans.comment} className={field} />
            </div>
          </Section>
        );
      })}

      <Section title="Approaches to Learning (ATL)" subtitle="Thinking, research, communication, social and self-management skills">
        {ATL_GROUPS.map((g) => (
          <div key={g.name}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mt-2 mb-1">{g.name}</p>
            {g.items.map((item, i) => (
              <RatingRow key={i} name={`atl_${g.name}_item_${i}`} criterion={item} defaultValue={data.atl[g.name]?.[i] ?? ""} />
            ))}
          </div>
        ))}
      </Section>

      <Section title="IB Learner Profile" subtitle="One overall rating per attribute for this term">
        {LEARNER_PROFILE.map((p) => (
          <RatingRow key={p.name} name={`lp_${p.name}`} criterion={p.name} defaultValue={data.learnerProfile[p.name] ?? ""} />
        ))}
      </Section>

      <Section title="Books Read" subtitle="One title per line">
        <textarea name="booksRead" rows={4} defaultValue={data.booksRead.join("\n")} className={field} placeholder="The Foolish Frog by Mapple Press" />
      </Section>

      <FormFeedback state={state} />

      <div className="sticky bottom-4 flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-lg">
        <SubmitButton name="intent" value="save" variant="subtle" pendingText="Saving…">
          <Save size={14} /> Save draft
        </SubmitButton>
        <SubmitButton name="intent" value="generate" pendingText="Generating…">
          <Sparkles size={14} /> Generate PDF
        </SubmitButton>
      </div>
    </form>
  );
}
