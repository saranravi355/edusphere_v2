"use client";

import { useMemo, useState } from "react";
import { Star, Search, Users, MessageSquareText } from "lucide-react";

type Row = {
  id: string;
  studentName: string;
  studentRegistrationNo: string;
  classroom: string | null;
  teacherName: string;
  classConductRating: number;
  explanationRating: number;
  communicationRating: number;
  supportRating: number;
  comment: string | null;
  updatedAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function overall(r: Row) {
  return (r.classConductRating + r.explanationRating + r.communicationRating + r.supportRating) / 4;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300 dark:text-zinc-700"} />
      ))}
    </span>
  );
}

function TeacherSummary({ rows }: { rows: Row[] }) {
  const byTeacher = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      if (!map.has(r.teacherName)) map.set(r.teacherName, []);
      map.get(r.teacherName)!.push(r);
    }
    return Array.from(map.entries())
      .map(([teacher, list]) => ({
        teacher,
        count: list.length,
        avg: list.reduce((s, r) => s + overall(r), 0) / list.length,
      }))
      .sort((a, b) => a.avg - b.avg);
  }, [rows]);

  if (byTeacher.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
        <Users size={15} className="text-indigo-600" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">By teacher</h3>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
        {byTeacher.map((t) => (
          <div key={t.teacher} className="px-5 py-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.teacher}</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">{t.count} response{t.count === 1 ? "" : "s"}</span>
              <Stars value={t.avg} />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{t.avg.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherFeedbackAdminClient({ rows, teacherNames }: { rows: Row[]; teacherNames: string[] }) {
  const [teacherFilter, setTeacherFilter] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (teacherFilter && r.teacherName !== teacherFilter) return false;
      if (q && !r.studentName.toLowerCase().includes(q) && !r.studentRegistrationNo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, teacherFilter, query]);

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        <MessageSquareText className="mx-auto mb-2 text-slate-400" size={28} />
        No feedback has been submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherSummary rows={rows} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or registration no."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-slate-100"
        >
          <option value="">All teachers</option>
          {teacherNames.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} of {rows.length} response{rows.length === 1 ? "" : "s"}</p>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {r.studentName} <span className="font-normal text-slate-400">→ {r.teacherName}</span>
                </p>
                <p className="text-[11px] text-slate-400">{r.studentRegistrationNo} · {r.classroom ?? "—"}</p>
              </div>
              <span className="text-[11px] text-slate-400">{fmt(r.updatedAt)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Class conduct</p>
                <Stars value={r.classConductRating} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Explanation</p>
                <Stars value={r.explanationRating} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Communication</p>
                <Stars value={r.communicationRating} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Support</p>
                <Stars value={r.supportRating} />
              </div>
            </div>
            {r.comment && (
              <div className="flex items-start gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <MessageSquareText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No feedback matches that filter.</p>
        )}
      </div>
    </div>
  );
}
