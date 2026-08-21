"use client";

import { useActionState, useMemo, useState } from "react";
import { Save, TrendingUp, Send } from "lucide-react";
import { SubmitButton, FormFeedback } from "@/components/ui/form";
import { saveGradebook, publishResults } from "./actions";

type Row = { id: string; name: string; registrationNo: string; grade: number | null; comment: string };

const input =
  "p-1.5 border border-slate-300 dark:border-zinc-700 rounded text-center text-sm font-medium " +
  "focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-slate-900 dark:text-slate-100";

export default function Gradebook({
  classroomId,
  title,
  term,
  type,
  subjectName,
  rows,
}: {
  classroomId: string;
  title: string;
  term: string;
  type: string;
  subjectName: string;
  rows: Row[];
}) {
  const [state, action] = useActionState(saveGradebook, undefined);
  const [publishState, publishAction] = useActionState(publishResults, undefined);
  const [query, setQuery] = useState("");
  const [grades, setGrades] = useState<Record<string, string>>(
    () => Object.fromEntries(rows.map((r) => [r.id, r.grade === null ? "" : String(r.grade)])),
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.registrationNo.toLowerCase().includes(q));
  }, [rows, query]);

  // The old "Class Average / Highest / Lowest" panel was three fixed strings.
  // These move as you type, and describe the grades actually entered.
  const entered = Object.values(grades).map(Number).filter((n) => n >= 1 && n <= 7);
  const average = entered.length ? (entered.reduce((a, b) => a + b, 0) / entered.length).toFixed(1) : null;
  const highest = entered.length ? Math.max(...entered) : null;
  const lowest = entered.length ? Math.min(...entered) : null;

  const band = (g: number) =>
    g >= 6 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : g >= 4 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <form action={action} className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <input type="hidden" name="classroomId" value={classroomId} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="term" value={term} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="subjectName" value={subjectName} />

        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap gap-3 justify-between items-center">
          <div>
            <label className="sr-only" htmlFor="gb-search">Search students</label>
            <input
              id="gb-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="p-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black w-64 text-slate-900 dark:text-slate-100"
              placeholder="Search students…"
            />
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-500">
            <span>{rows.length} student{rows.length === 1 ? "" : "s"}</span>
            <span>{entered.length} graded</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                <th className="p-4 font-medium min-w-[200px]">Student</th>
                <th className="p-4 font-medium">IB grade (1–7)</th>
                <th className="p-4 font-medium">Band</th>
                <th className="p-4 font-medium min-w-[250px]">Teacher comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {visible.map((r) => {
                const g = Number(grades[r.id]);
                const valid = g >= 1 && g <= 7;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.registrationNo}</p>
                    </td>
                    <td className="p-4">
                      <label className="sr-only" htmlFor={`grade-${r.id}`}>Grade for {r.name}</label>
                      <input
                        id={`grade-${r.id}`}
                        name={`grade-${r.id}`}
                        type="number"
                        min={1}
                        max={7}
                        step={1}
                        value={grades[r.id] ?? ""}
                        onChange={(e) => setGrades((p) => ({ ...p, [r.id]: e.target.value }))}
                        className={`w-16 ${input}`}
                      />
                    </td>
                    <td className="p-4">
                      {valid ? (
                        <span className={`px-3 py-1 rounded-md text-sm font-bold w-10 text-center inline-block ${band(g)}`}>{g}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <label className="sr-only" htmlFor={`comment-${r.id}`}>Comment for {r.name}</label>
                      <input
                        id={`comment-${r.id}`}
                        name={`comment-${r.id}`}
                        type="text"
                        defaultValue={r.comment}
                        placeholder="Enter feedback…"
                        className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-black text-slate-700 dark:text-slate-300"
                      />
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-slate-500">
                    {rows.length === 0 ? "No active students in this class." : "No student matches that search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          <FormFeedback state={state} className="flex-1 min-w-[12rem]" />
          <SubmitButton pendingText="Saving…" disabled={rows.length === 0}>
            <Save size={16} aria-hidden /> Save grades
          </SubmitButton>
        </div>
      </form>

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" aria-hidden />
            This assessment
          </h3>

          <dl className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <dt className="text-sm text-slate-500">Average</dt>
              <dd className="font-bold text-slate-800 dark:text-slate-100">{average ?? "—"}</dd>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <dt className="text-sm text-slate-500">Highest</dt>
              <dd className="font-bold text-green-600 dark:text-green-500">{highest ?? "—"}</dd>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
              <dt className="text-sm text-slate-500">Lowest</dt>
              <dd className="font-bold text-red-600 dark:text-red-500">{lowest ?? "—"}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-400 mt-2">Updates as you type; save to keep it.</p>

          <form action={publishAction} className="mt-6 space-y-2">
            <input type="hidden" name="classroomId" value={classroomId} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="term" value={term} />
            <SubmitButton className="w-full" pendingText="Publishing…" disabled={entered.length === 0}>
              <Send size={16} aria-hidden /> Publish to families
            </SubmitButton>
            <FormFeedback state={publishState} />
            <p className="text-xs text-center text-slate-400">
              Sends each student and their parents a notification with this grade. Save first.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
