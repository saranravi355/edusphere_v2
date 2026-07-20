"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, Users, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { autoGenerateTimetable, type GenerateResult } from "./actions";

const DAY_NAMES = ["", "MON", "TUE", "WED", "THU", "FRI"];
const PERIOD_TIMES = ["", "08:30", "09:30", "10:45", "11:45", "13:30", "14:30"];

export default function AutoGenerateClient({
  classrooms,
  subjectCount,
  teacherCount,
}: {
  classrooms: { id: string; name: string }[];
  subjectCount: number;
  teacherCount: number;
}) {
  const [classroomId, setClassroomId] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await autoGenerateTimetable(classroomId);
      if (res.error) setError(res.error);
      else setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {/* Setup card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class / Section</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="">Select a class…</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><BookOpen size={15} /> {subjectCount} subjects</span>
            <span className="flex items-center gap-1.5"><Users size={15} /> {teacherCount} teachers</span>
          </div>
          <button
            onClick={generate}
            disabled={!classroomId || isPending}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isPending ? "Solving constraints…" : "Generate Timetable"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Replaces the selected class&apos;s current timetable. Existing timetables of other sections are treated as hard
          constraints — a teacher already scheduled elsewhere will never be double-booked.
        </p>
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">{error}</div>
        )}
      </div>

      {/* Result */}
      {result?.success && result.stats && result.slots && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Slots Scheduled", value: `${result.stats.filled}/${result.stats.total}`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
              { label: "Conflicts Avoided", value: result.stats.conflictsAvoided, icon: ShieldCheck, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
              { label: "Teachers Used", value: result.stats.teachersUsed, icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
              { label: "Generation Time", value: "< 60s", icon: Sparkles, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-x-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Generated Weekly Timetable</h3>
              <Link
                href="/admin/academic-setup/timetable"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Fine-tune in Timetable Manager <ArrowRight size={13} />
              </Link>
            </div>
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/50">
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wide">Period</th>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <th key={d} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wide">{DAY_NAMES[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <tr key={p} className="border-t border-slate-100 dark:border-zinc-800/50">
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      P{p} <span className="font-normal text-slate-400">{PERIOD_TIMES[p]}</span>
                    </td>
                    {[1, 2, 3, 4, 5].map((d) => {
                      const slot = result.slots!.find((s) => s.dayOfWeek === d && s.period === p);
                      return (
                        <td key={d} className="px-4 py-3">
                          {slot ? (
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{slot.subjectName}</p>
                              <p className="text-slate-500">{slot.teacherName}</p>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
