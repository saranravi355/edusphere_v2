"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, GraduationCap, X, Eye, Award, TrendingUp } from "lucide-react";
import { createObservation } from "./actions";

interface LastObservation {
  date: string;
  observerName: string;
  focusArea: string | null;
  planningScore: number;
  deliveryScore: number;
  engagementScore: number;
  assessmentScore: number;
  strengths: string | null;
  growthAreas: string | null;
}

interface Row {
  id: string;
  name: string;
  yearly: Record<string, number>;
  subjects: string;
  cpdHours: number;
  pdCount: number;
  obsCount: number;
  avgScore: number | null;
  lastObservation: LastObservation | null;
}

const CRITERIA = [
  { name: "planningScore", label: "Planning & Preparation" },
  { name: "deliveryScore", label: "Lesson Delivery" },
  { name: "engagementScore", label: "Student Engagement" },
  { name: "assessmentScore", label: "Assessment & Feedback" },
];

function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 6) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 4.5) return "text-blue-600 dark:text-blue-400";
  return "text-amber-600 dark:text-amber-400";
}

export default function AppraisalClient({ rows, years, observerName }: { rows: Row[]; years: string[]; observerName: string }) {
  const [observing, setObserving] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCPD = rows.reduce((n, r) => n + r.cpdHours, 0);
  const observed = rows.filter((r) => r.obsCount > 0).length;
  const schoolAvg =
    rows.filter((r) => r.avgScore !== null).length > 0
      ? rows.filter((r) => r.avgScore !== null).reduce((n, r) => n + (r.avgScore || 0), 0) /
        rows.filter((r) => r.avgScore !== null).length
      : null;

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createObservation(formData);
      if (res?.error) setError(res.error);
      else setObserving(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCPD}h</p>
            <p className="text-xs text-slate-500">Total CPD hours logged</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
            <Eye size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{observed}/{rows.length}</p>
            <p className="text-xs text-slate-500">Teachers observed this cycle</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${scoreColor(schoolAvg)}`}>
              {schoolAvg !== null ? schoolAvg.toFixed(1) : "—"} <span className="text-sm font-normal text-slate-500">/ 7</span>
            </p>
            <p className="text-xs text-slate-500">School-wide observation average</p>
          </div>
        </div>
      </div>

      {/* Year-on-year trends */}
      {years.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-x-auto">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Year-on-year observation trends</h3>
            <span className="text-xs text-slate-400 ml-2">Average score per academic year (IB 1–7 scale)</span>
          </div>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-left">
                <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Teacher</th>
                {years.map((y) => (
                  <th key={y} className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide text-center">AY {y}</th>
                ))}
                <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide text-center">Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vals = years.map((y) => r.yearly[y]);
                const known = vals.filter((v): v is number => v !== undefined);
                const delta = known.length >= 2 ? known[known.length - 1] - known[0] : null;
                return (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-zinc-800/50">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{r.name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`px-5 py-3 text-center font-bold ${scoreColor(v ?? null)}`}>{v ?? "—"}</td>
                    ))}
                    <td className="px-5 py-3 text-center">
                      {delta === null ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <span className={`text-xs font-bold ${delta > 0.2 ? "text-emerald-600 dark:text-emerald-400" : delta < -0.2 ? "text-red-500" : "text-slate-500"}`}>
                          {delta > 0.2 ? "▲" : delta < -0.2 ? "▼" : "▬"} {delta > 0 ? "+" : ""}{Math.round(delta * 10) / 10}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-left">
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Teacher</th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">CPD Hours</th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Observations</th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Avg Score</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.subjects}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`font-bold ${r.cpdHours >= 20 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {r.cpdHours}h
                  </span>
                  <span className="text-xs text-slate-400 ml-1">({r.pdCount} activities)</span>
                </td>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{r.obsCount}</td>
                <td className={`px-5 py-3.5 font-bold ${scoreColor(r.avgScore)}`}>
                  {r.avgScore !== null ? `${r.avgScore.toFixed(1)} / 7` : "Not observed"}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {r.lastObservation && (
                    <button onClick={() => setViewing(r)} className="text-xs font-bold text-slate-500 hover:underline mr-3">
                      View last
                    </button>
                  )}
                  <button
                    onClick={() => setObserving(r)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    New observation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observation form modal */}
      {observing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setObserving(null)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ClipboardCheck size={18} className="text-blue-600" /> Observe {observing.name}
              </h3>
              <button onClick={() => setObserving(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">{error}</div>
            )}

            <form action={submit} className="space-y-4">
              <input type="hidden" name="teacherId" value={observing.id} />
              <input type="hidden" name="observerName" value={observerName} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class</label>
                  <input name="className" placeholder="e.g. MYP 4 Sciences" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Focus Area</label>
                  <input name="focusArea" placeholder="e.g. ATL skill integration" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>

              <div className="space-y-3">
                {CRITERIA.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-4">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.label}</label>
                    <select name={c.name} defaultValue="5" className="px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400">IB scale: 7 = exemplary, 4 = satisfactory, 1 = significant concern.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Strengths</label>
                <textarea name="strengths" rows={2} className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Areas for Growth</label>
                <textarea name="growthAreas" rows={2} className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl resize-none" />
              </div>

              <button type="submit" disabled={isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Save Observation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View last observation modal */}
      {viewing && viewing.lastObservation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Award size={18} className="text-purple-600" /> {viewing.name}
              </h3>
              <button onClick={() => setViewing(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Observed by {viewing.lastObservation.observerName} on {new Date(viewing.lastObservation.date).toLocaleDateString('en-GB')}
              {viewing.lastObservation.focusArea ? ` · Focus: ${viewing.lastObservation.focusArea}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CRITERIA.map((c, i) => {
                const scores = [
                  viewing.lastObservation!.planningScore,
                  viewing.lastObservation!.deliveryScore,
                  viewing.lastObservation!.engagementScore,
                  viewing.lastObservation!.assessmentScore,
                ];
                return (
                  <div key={c.name} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-500">{c.label}</p>
                    <p className={`text-xl font-bold ${scoreColor(scores[i])}`}>{scores[i]} / 7</p>
                  </div>
                );
              })}
            </div>
            {viewing.lastObservation.strengths && (
              <div className="text-sm">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wide mb-1">Strengths</p>
                <p className="text-slate-600 dark:text-slate-300">{viewing.lastObservation.strengths}</p>
              </div>
            )}
            {viewing.lastObservation.growthAreas && (
              <div className="text-sm">
                <p className="font-bold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wide mb-1">Areas for Growth</p>
                <p className="text-slate-600 dark:text-slate-300">{viewing.lastObservation.growthAreas}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
