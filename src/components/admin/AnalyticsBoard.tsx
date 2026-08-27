"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";

/**
 * The charts for /admin/analytics.
 *
 * Everything here is a distribution, a trend or a cohort comparison — never a
 * queue and never a number about right now. That is the whole boundary between
 * this page and /admin/live: if a panel would make someone pick up the phone
 * today, it belongs on Live instead.
 *
 * All values arrive pre-computed and pre-formatted from the server component.
 * Nothing in here touches a Date: recharts renders in the browser, and
 * toLocale* output drifts between Node and Chromium, which is a hydration
 * mismatch waiting to happen (see src/lib/dates.ts).
 */

export interface AnalyticsBoardProps {
  attendanceByDay: { day: string; rate: number }[];
  attendanceByYearGroup: { group: string; rate: number }[];
  attendanceByWeekday: { day: string; rate: number }[];
  gradeDistribution: { grade: string; students: number }[];
  gradeBySubjectGroup: { group: string; average: number }[];
  mypCriteria: { criterion: string; average: number }[];
  collectionByYear: { year: string; collected: number; outstanding: number }[];
  behaviourByYearGroup: { group: string; merits: number; demerits: number }[];
}

const INK = "#64748b";
const GRID = "#94a3b8";

/** IB 1–7: red at the bottom, green at the top, so the shape reads at a glance. */
const GRADE_COLOURS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981"];

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {hint && <p className="text-xs text-slate-400 mt-0.5 mb-4">{hint}</p>}
      <div className="h-[280px] w-full mt-2">{children}</div>
    </div>
  );
}

const axis = { axisLine: false, tickLine: false, tick: { fill: INK, fontSize: 11 } } as const;

export default function AnalyticsBoard(p: AnalyticsBoardProps) {
  // recharts renders SVG measured from the DOM, so it cannot be server-rendered
  // without a hydration mismatch. Gate it on mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-mount gate for recharts
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[380px] bg-slate-50 dark:bg-slate-900/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel title="Attendance, day by day this term"
             hint="Every school day since term began. A single dip is a wet Monday; a slope is a problem.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={p.attendanceByDay} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="day" {...axis} interval="preserveStartEnd" />
            <YAxis domain={[80, 100]} {...axis} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, "present"]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Attendance by year group"
             hint="Which year groups are carrying the absence. Whole-term average.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.attendanceByYearGroup} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="group" {...axis} />
            <YAxis domain={[80, 100]} {...axis} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, "present"]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {p.attendanceByYearGroup.map((d, i) => (
                <Cell key={i} fill={d.rate < 90 ? "#f59e0b" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="IB grade distribution (1–7)"
             hint="Every subject record this term. A healthy cohort peaks at 5 and thins either side.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.gradeDistribution} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="grade" {...axis} />
            <YAxis {...axis} />
            <Tooltip formatter={(v) => [`${v} subject entries`, ""]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="students" radius={[4, 4, 0, 0]}>
              {p.gradeDistribution.map((_, i) => <Cell key={i} fill={GRADE_COLOURS[i] ?? "#3b82f6"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Average grade by IB subject group"
             hint="Groups 1–6. A group sitting a full point below the others is a teaching-capacity question.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.gradeBySubjectGroup} layout="vertical" margin={{ top: 5, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} opacity={0.2} />
            <XAxis type="number" domain={[0, 7]} {...axis} />
            <YAxis type="category" dataKey="group" width={130} {...axis} />
            <Tooltip formatter={(v) => [`${v} average`, ""]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="average" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {p.mypCriteria.length > 0 && (
        <Panel title="MYP criteria A–D, cohort average"
               hint="Marked out of 8. An uneven profile says the assessment diet is unbalanced, not that students are weak.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={p.mypCriteria} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
              <XAxis dataKey="criterion" {...axis} />
              <YAxis domain={[0, 8]} {...axis} />
              <Tooltip formatter={(v) => [`${v} / 8`, "average"]}
                       contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="average" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel title="Fee collection, this year against last"
             hint="Billed against received, by academic year. Outstanding includes what is not yet due.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.collectionByYear} margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="year" {...axis} />
            <YAxis {...axis} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
            <Tooltip formatter={(v) => [`₹${(Number(v) / 100000).toFixed(1)}L`, ""]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="collected" name="Received" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="outstanding" name="Outstanding" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Behaviour balance by year group"
               hint="Merits against demerits. A year group with demerits and no merits is a pastoral signal.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.behaviourByYearGroup} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="group" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="merits" name="Merits" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="demerits" name="Demerits" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Attendance by day of the week"
             hint="Averaged across the term. Mondays and Fridays are where absence hides.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.attendanceByWeekday} margin={{ top: 5, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} opacity={0.2} />
            <XAxis dataKey="day" {...axis} />
            <YAxis domain={[80, 100]} {...axis} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, "present"]}
                     contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
