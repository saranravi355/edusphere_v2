"use client";

import { useMemo, useState, useTransition } from "react";
import { HeartHandshake, Search, CheckCircle2, AlertTriangle, Palette, Dumbbell, Users, BellRing, Loader2 } from "lucide-react";
import { sendCASNudge } from "./actions";

interface Row {
  id: string;
  studentId: string;
  name: string;
  registrationNo: string;
  classroom: string | null;
  creativity: number;
  activity: number;
  service: number;
  reflections: number;
  total: number;
  status: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  COMPLETE: { label: "Complete", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ON_TRACK: { label: "On track", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  NEEDS_ATTENTION: { label: "Needs attention", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

function StrandBar({ value, target, color }: { value: number; target: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
      </div>
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-8">{value}h</span>
    </div>
  );
}

export default function CASClient({
  rows,
  strandTarget,
  reflectionTarget,
}: {
  rows: Row[];
  strandTarget: number;
  reflectionTarget: number;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (q && !`${r.name} ${r.registrationNo} ${r.classroom || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, filter]);

  const stats = {
    total: rows.length,
    complete: rows.filter((r) => r.status === "COMPLETE").length,
    onTrack: rows.filter((r) => r.status === "ON_TRACK").length,
    attention: rows.filter((r) => r.status === "NEEDS_ATTENTION").length,
  };

  function nudge(row: Row) {
    setPendingId(row.studentId);
    const weakest =
      row.creativity <= row.activity && row.creativity <= row.service
        ? "Creativity"
        : row.activity <= row.service
        ? "Activity"
        : "Service";
    startTransition(async () => {
      await sendCASNudge(
        row.studentId,
        `Your CAS portfolio needs attention: your ${weakest} strand is at ${Math.min(row.creativity, row.activity, row.service)}h and you have ${row.reflections} reflections logged (target ${reflectionTarget}). Please update your CAS log this week.`
      );
      setNudged((prev) => new Set(prev).add(row.studentId));
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "DP students with CAS", value: stats.total, icon: HeartHandshake, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Complete", value: stats.complete, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "On track", value: stats.onTrack, icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
          { label: "Needs attention", value: stats.attention, icon: AlertTriangle, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
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

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, reg no or class…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: "ALL", label: "All" },
            { id: "NEEDS_ATTENTION", label: "Needs attention" },
            { id: "ON_TRACK", label: "On track" },
            { id: "COMPLETE", label: "Complete" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                filter === f.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-left">
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Student</th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide"><span className="flex items-center gap-1"><Palette size={12} /> Creativity</span></th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide"><span className="flex items-center gap-1"><Dumbbell size={12} /> Activity</span></th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide"><span className="flex items-center gap-1"><HeartHandshake size={12} /> Service</span></th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Reflections</th>
              <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <tr key={r.id} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.classroom || "—"} · {r.registrationNo}</p>
                  </td>
                  <td className="px-5 py-3"><StrandBar value={r.creativity} target={strandTarget} color="bg-purple-500" /></td>
                  <td className="px-5 py-3"><StrandBar value={r.activity} target={strandTarget} color="bg-emerald-500" /></td>
                  <td className="px-5 py-3"><StrandBar value={r.service} target={strandTarget} color="bg-blue-500" /></td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${r.reflections >= reflectionTarget ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>
                      {r.reflections}
                    </span>
                    <span className="text-[11px] text-slate-400"> / {reflectionTarget}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status !== "COMPLETE" && (
                      nudged.has(r.studentId) ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 size={13} /> Nudged
                        </span>
                      ) : (
                        <button
                          onClick={() => nudge(r)}
                          disabled={pendingId === r.studentId}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end disabled:opacity-50"
                        >
                          {pendingId === r.studentId ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />} Nudge
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Benchmarks: {strandTarget}h per strand and {reflectionTarget} reflections over the two-year DP. Nudges send a real
        in-app notification to the student.
      </p>
    </div>
  );
}
