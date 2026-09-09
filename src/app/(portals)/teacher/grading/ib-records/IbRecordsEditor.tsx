"use client";

import { useActionState, useMemo, useState } from "react";
import { Save, TrendingUp } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { CRITERIA, CRITERION_MAX, CRITERION_MIN, GRADE_MAX, GRADE_MIN, findSubject, type Programme } from "@/lib/ib/subjects";
import { criterionTotal, mypGradeFromCriteria } from "@/lib/ib/mypGrade";
import { saveIbRecords } from "./actions";

export interface IbRow {
  id: string;
  name: string;
  registrationNo: string;
  curriculum: string;
  hasRecord: boolean;
  level: string | null;
  currentGrade: number | null;
  predictedGrade: number | null;
  critA: number | null;
  critB: number | null;
  critC: number | null;
  critD: number | null;
  comment: string;
}

const cell =
  "w-14 p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium " +
  "focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-slate-900 dark:text-slate-100";
const text =
  "w-full p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-sm " +
  "focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-slate-900 dark:text-slate-100";

export default function IbRecordsEditor({
  classroomId, className, subjectName, term, programme, rows,
}: {
  classroomId: string;
  className: string;
  subjectName: string;
  term: string;
  programme: Programme;
  rows: IbRow[];
}) {
  const [state, action] = useActionState(saveIbRecords, undefined);
  const [query, setQuery] = useState("");
  // Held in state purely so the summary below moves as grades are typed. The
  // values that get saved are the inputs' own, read from the form.
  const [current, setCurrent] = useState<Record<string, string>>(
    () => Object.fromEntries(rows.map((r) => [r.id, r.currentGrade === null ? "" : String(r.currentGrade)])),
  );
  // Criteria are held here too, because for a MYP student they now decide the
  // grade: the cell next to them has to move as they are typed.
  const [crit, setCrit] = useState<Record<string, Record<string, string>>>(
    () => Object.fromEntries(rows.map((r) => [
      r.id,
      Object.fromEntries(CRITERIA.map((k) => {
        const v = r[`crit${k}` as "critA"];
        return [k, v === null ? "" : String(v)];
      })),
    ])),
  );

  const levels = findSubject(subjectName)?.levels ?? (programme === "DP" ? ["HL", "SL"] : ["MYP"]);
  const showCriteria = rows.some((r) => r.curriculum === "MYP");

  /** The four criterion levels a row currently holds, as numbers or null. */
  const levelsOf = (id: string) =>
    CRITERIA.map((k) => {
      const raw = crit[id]?.[k] ?? "";
      return raw === "" ? null : Number(raw);
    }) as [number | null, number | null, number | null, number | null];

  /** The grade the IB table gives this row, or null while it is incomplete. */
  const derivedOf = (id: string) => mypGradeFromCriteria(...levelsOf(id));

  /** What will actually be stored — the same rule the save action applies. */
  const effectiveOf = (r: IbRow) => {
    if (r.curriculum !== "MYP") return Number(current[r.id]);
    return derivedOf(r.id) ?? Number(current[r.id]);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.registrationNo.toLowerCase().includes(q));
  }, [rows, query]);

  const entered = rows.map(effectiveOf).filter((n) => n >= GRADE_MIN && n <= GRADE_MAX);
  const average = entered.length ? (entered.reduce((a, b) => a + b, 0) / entered.length).toFixed(1) : null;
  const withRecord = rows.filter((r) => r.hasRecord).length;

  const band = (g: number) =>
    g >= 6 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : g >= 4 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <input type="hidden" name="classroomId" value={classroomId} />
      <input type="hidden" name="subjectName" value={subjectName} />
      <input type="hidden" name="term" value={term} />

      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap gap-3 justify-between items-center">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{subjectName}</p>
          <p className="text-xs text-slate-400">{className} · {term}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="sr-only" htmlFor="ib-search">Search students</label>
          <input
            id="ib-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="p-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black w-48 text-slate-900 dark:text-slate-100"
          />
          <span className="text-sm font-medium text-slate-500">{withRecord} of {rows.length} on record</span>
          {average && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <TrendingUp size={14} aria-hidden /> avg {average}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-900/50 text-left">
            <tr className="text-[11px] uppercase tracking-wide text-slate-400">
              <th scope="col" className="py-2 px-4 font-bold">Student</th>
              <th scope="col" className="py-2 px-2 font-bold">Level</th>
              <th scope="col" className="py-2 px-2 font-bold text-center">Current<span className="font-normal normal-case"> /7</span></th>
              <th scope="col" className="py-2 px-2 font-bold text-center">Predicted<span className="font-normal normal-case"> /7</span></th>
              {showCriteria && CRITERIA.map((k) => (
                <th key={k} scope="col" className="py-2 px-2 font-bold text-center">
                  {k}<span className="font-normal normal-case"> /8</span>
                </th>
              ))}
              <th scope="col" className="py-2 px-4 font-bold">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {visible.map((r) => {
              const isMyp = r.curriculum === "MYP";
              const derived = isMyp ? derivedOf(r.id) : null;
              const total = isMyp ? criterionTotal(...levelsOf(r.id)) : null;
              const g = effectiveOf(r);
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30">
                  <td className="py-2 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {r.registrationNo}
                      {!r.hasRecord && <span className="ml-2 text-amber-600 dark:text-amber-500 font-sans">no record yet</span>}
                    </p>
                  </td>
                  <td className="py-2 px-2">
                    <select name={`level.${r.id}`} defaultValue={r.level ?? levels[0]} className={`${cell} w-20`}>
                      {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {derived !== null ? (
                      // Marked in full: the grade is the IB table's answer, so
                      // it is shown rather than asked for. Typing a different
                      // number here would not have survived the save anyway.
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`w-14 py-1.5 rounded text-sm font-bold ${band(derived)}`}
                          title={`Criterion total ${total} of 32 converts to grade ${derived}`}
                        >
                          {derived}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{total}/32</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <input
                          name={`current.${r.id}`}
                          type="number"
                          min={GRADE_MIN}
                          max={GRADE_MAX}
                          step={1}
                          value={current[r.id] ?? ""}
                          onChange={(e) => setCurrent((p) => ({ ...p, [r.id]: e.target.value }))}
                          aria-label={`Current grade for ${r.name}`}
                          className={cell}
                        />
                        {g >= GRADE_MIN && g <= GRADE_MAX && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${band(g)}`}>{g}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      name={`predicted.${r.id}`}
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      step={1}
                      defaultValue={r.predictedGrade ?? ""}
                      aria-label={`Predicted grade for ${r.name}`}
                      className={cell}
                    />
                  </td>
                  {showCriteria && CRITERIA.map((k) => (
                    <td key={k} className="py-2 px-2 text-center">
                      {isMyp ? (
                        <input
                          name={`crit${k}.${r.id}`}
                          type="number"
                          min={CRITERION_MIN}
                          max={CRITERION_MAX}
                          step={1}
                          value={crit[r.id]?.[k] ?? ""}
                          onChange={(e) =>
                            setCrit((p) => ({ ...p, [r.id]: { ...p[r.id], [k]: e.target.value } }))
                          }
                          aria-label={`Criterion ${k} for ${r.name}`}
                          className={cell}
                        />
                      ) : (
                        // Criteria are MYP's. A DP student has none, and the
                        // action ignores anything posted for one anyway.
                        <span className="text-slate-300 dark:text-zinc-700">—</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-4">
                    <input
                      name={`comment.${r.id}`}
                      defaultValue={r.comment}
                      placeholder="Optional"
                      aria-label={`Comment for ${r.name}`}
                      className={text}
                    />
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={showCriteria ? 9 : 5} className="py-8 text-center text-sm text-slate-400">
                  No student matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 space-y-3">
        <FormFeedback state={state} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Saving…" className="!bg-blue-600 hover:!bg-blue-700 !text-white">
            <Save size={16} aria-hidden /> Save IB records
          </SubmitButton>
          <p className="text-xs text-slate-400">
            {showCriteria
              ? "For MYP students the 1–7 grade is the IB conversion of the four criterion totals, so it is shown rather than typed. Mark all four criteria and the grade follows; until then you can enter one by hand. "
              : ""}
            Saved records appear on the student profile, the report card and the predicted-grade analysis.
            A student with nothing entered is skipped rather than given an empty record.
          </p>
        </div>
      </div>
    </form>
  );
}
