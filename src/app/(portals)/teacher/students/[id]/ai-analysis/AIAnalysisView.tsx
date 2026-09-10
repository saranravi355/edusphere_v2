"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

export interface SubjectPoint {
  subject: string;
  current: number | null;
  predicted: number | null;
}

export interface MonthPoint {
  month: string;
  /** Average of that month's assessment results, on the IB 1–7 scale. */
  grade: number;
}

const TICKS = [1, 2, 3, 4, 5, 6, 7];
const AXIS_TICK = { fill: "#64748b", fontSize: 12 };
const TOOLTIP_STYLE = { borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" };
const CARD = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm";
const HEADING = "text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2";

/** The two charts, drawn from the student's own record on the IB 1–7 scale. */
export default function AIAnalysisView({ subjects, months }: { subjects: SubjectPoint[]; months: MonthPoint[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={CARD}>
        <h3 className={HEADING}>
          <TrendingUp size={18} className="text-green-500" /> Assessment grades by month
        </h3>
        {months.length === 0 ? (
          <p className="text-sm text-slate-400">No dated assessment results on record yet.</p>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} domain={[1, 7]} ticks={TICKS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="grade" name="Average grade (1–7)" stroke="#6366f1" strokeWidth={2} fill="url(#gradeFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={CARD}>
        <h3 className={HEADING}>
          <BarChart3 size={18} className="text-orange-500" /> Current and predicted, by subject
        </h3>
        {subjects.length === 0 ? (
          <p className="text-sm text-slate-400">No IB subject records yet.</p>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                <XAxis type="number" domain={[0, 7]} ticks={TICKS} axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis type="category" dataKey="subject" axisLine={false} tickLine={false} tick={AXIS_TICK} width={110} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="current" name="Current" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={12} />
                <Bar dataKey="predicted" name="Predicted" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
