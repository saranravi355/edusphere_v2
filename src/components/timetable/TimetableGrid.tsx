"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export type TimetableEntryProps = {
  id: string;
  dayOfWeek: number; // 1 = Mon, 5 = Fri
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

const periods = [
  { id: 1, name: "Period 1", time: "08:30-09:30" },
  { id: 2, name: "Period 2", time: "09:30-10:30" },
  { id: 3, name: "Period 3", time: "10:45-11:45" },
  { id: 4, name: "Period 4", time: "11:45-12:45" },
  { id: 5, name: "Period 5", time: "13:30-14:30" },
  { id: 6, name: "Period 6", time: "14:30-15:30" },
];

const days = [
  { id: 1, name: "MONDAY" },
  { id: 2, name: "TUESDAY" },
  { id: 3, name: "WEDNESDAY" },
  { id: 4, name: "THURSDAY" },
  { id: 5, name: "FRIDAY" },
];

export default function TimetableGrid({ 
  entries, 
  isEditable = false,
  onAllocate,
  onEdit,
  getSubjectHref
}: { 
  entries: TimetableEntryProps[], 
  isEditable?: boolean,
  onAllocate?: (day: number, period: number) => void,
  onEdit?: (day: number, period: number) => void,
  getSubjectHref?: (subject: string) => string
}) {

  const getEntry = (day: number, period: number) => {
    return entries.find(e => e.dayOfWeek === day && e.period === period);
  };

  const getColors = (subject: string) => {
    const map: Record<string, string> = {
      Mathematics: "text-blue-600 bg-blue-50 dark:bg-blue-900/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
      Physics: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/10 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30",
      Calculus: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
      "English Language": "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
      "English Literature": "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
      "World History": "text-amber-600 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
      Chemistry: "text-purple-600 bg-purple-50 dark:bg-purple-900/10 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
    };
    return map[subject] || "text-slate-600 bg-slate-50 dark:bg-zinc-800/50 dark:text-slate-400 border-slate-200 dark:border-zinc-800";
  };

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div className="min-w-[1000px]">
        {/* Header Row */}
        <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
          <div className="p-4 text-xs font-bold text-slate-500 tracking-wider">PERIOD</div>
          {days.map(day => (
            <div key={day.id} className="p-4 text-xs font-bold text-slate-500 tracking-wider text-center">
              {day.name}
            </div>
          ))}
        </div>

        {/* Grid Rows */}
        {periods.map(period => (
          <div key={period.id} className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
            {/* Period Label */}
            <div className="p-4 flex flex-col justify-center border-r border-slate-100 dark:border-zinc-800/50">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{period.name}</span>
              <span className="text-xs text-slate-500">{period.time}</span>
            </div>

            {/* Day Cells */}
            {days.map(day => {
              const entry = getEntry(day.id, period.id);
              return (
                <div key={`${day.id}-${period.id}`} className="p-2 border-r border-slate-100 dark:border-zinc-800/50 last:border-0 h-28 flex">
                  {entry ? (
                    (() => {
                      const cellClass = `w-full h-full rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer hover:shadow-sm ${getColors(entry.subject)}`;
                      const inner = (
                        <>
                          <span className="font-bold text-sm leading-tight mb-1">{entry.subject}</span>
                          <span className="text-xs font-medium opacity-80">{entry.teacher}</span>
                          <span className="text-[10px] opacity-70">{entry.room}</span>
                        </>
                      );
                      const href = getSubjectHref?.(entry.subject);
                      return href ? (
                        <Link href={href} className={cellClass} title={`Open ${entry.subject}`}>
                          {inner}
                        </Link>
                      ) : (
                        <div onClick={() => onEdit?.(day.id, period.id)} className={cellClass}>
                          {inner}
                        </div>
                      );
                    })()
                  ) : (
                    isEditable ? (
                      <button 
                        onClick={() => onAllocate?.(day.id, period.id)}
                        className="w-full h-full rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-xs font-medium gap-1"
                      >
                        <Plus size={14} /> Allocate
                      </button>
                    ) : (
                      <div className="w-full h-full rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 flex items-center justify-center text-slate-300 dark:text-zinc-700 text-xs font-medium">
                        Free
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
