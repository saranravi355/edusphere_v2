"use client";

import { useState, useTransition } from "react";
import { GraduationCap, Plus, X, Award, BookOpen, Users, Presentation, Eye } from "lucide-react";
import { logPDRecord } from "./actions";

interface PDRecordRow {
  id: string;
  title: string;
  type: string;
  provider: string | null;
  hours: number;
  dateCompleted: string;
  notes: string | null;
}

interface ObservationRow {
  id: string;
  date: string;
  observerName: string;
  className: string | null;
  focusArea: string | null;
  avg: number;
  strengths: string | null;
  growthAreas: string | null;
}

const TYPE_META: Record<string, { icon: typeof Award; color: string }> = {
  WORKSHOP: { icon: Users, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  CERTIFICATION: { icon: Award, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  COURSE: { icon: BookOpen, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
  CONFERENCE: { icon: Presentation, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function PDClient({
  records,
  observations,
  baseHours,
  target,
}: {
  records: PDRecordRow[];
  observations: ObservationRow[];
  baseHours: number;
  target: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalHours = baseHours + records.reduce((n, r) => n + r.hours, 0);
  const pct = Math.min(100, Math.round((totalHours / target) * 100));

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await logPDRecord(formData);
      if (res?.error) setError(res.error);
      else setShowForm(false);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: CPD progress + log */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {totalHours}h <span className="text-sm font-normal text-slate-500">/ {target}h target</span>
                </p>
                <p className="text-xs text-slate-500">CPD hours this academic year</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={16} /> Log Activity
            </button>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{pct}% of annual target</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Activity Log</h3>
          </div>
          {records.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No PD activities logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
              {records.map((r) => {
                const meta = TYPE_META[r.type] || TYPE_META.WORKSHOP;
                return (
                  <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <meta.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500">
                        {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
                        {r.provider ? ` · ${r.provider}` : ""} · {new Date(r.dateCompleted).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.hours}h</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: observation feedback */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <Eye size={16} className="text-purple-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Observation Feedback</h3>
          </div>
          {observations.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No observations yet this cycle.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
              {observations.map((o) => (
                <div key={o.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {new Date(o.date).toLocaleDateString()} · {o.observerName}
                      {o.className ? ` · ${o.className}` : ""}
                    </p>
                    <span
                      className={`text-sm font-bold ${
                        o.avg >= 6
                          ? "text-emerald-600 dark:text-emerald-400"
                          : o.avg >= 4.5
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {o.avg.toFixed(1)} / 7
                    </span>
                  </div>
                  {o.focusArea && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Focus: {o.focusArea}</p>
                  )}
                  {o.strengths && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">✓ {o.strengths}</p>
                  )}
                  {o.growthAreas && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">→ {o.growthAreas}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log PD modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Log PD Activity</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">{error}</div>
            )}

            <form action={submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
                <input name="title" required placeholder="e.g. IB Category 2 Workshop — Sciences" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                  <select name="type" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                    <option value="WORKSHOP">Workshop</option>
                    <option value="CERTIFICATION">Certification</option>
                    <option value="COURSE">Course</option>
                    <option value="CONFERENCE">Conference</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hours</label>
                  <input type="number" name="hours" required min={1} max={200} placeholder="8" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Provider</label>
                  <input name="provider" placeholder="e.g. IBO" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date Completed</label>
                  <input type="date" name="dateCompleted" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea name="notes" rows={2} className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
              </div>
              <button type="submit" disabled={isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Log Activity"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
