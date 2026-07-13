"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Flag, Landmark, Plus, RefreshCw, Trash2, X, Loader2, CheckCircle2 } from "lucide-react";
import { syncNationalCalendar, syncIBExamWindows, addCalendarEvent, deleteCalendarEvent } from "./actions";

interface Ev {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  source: string;
  notes: string | null;
}

const TYPE_META: Record<string, { label: string; cls: string }> = {
  TERM: { label: "Term", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  NATIONAL_HOLIDAY: { label: "National holiday", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  HOLIDAY: { label: "School holiday", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  EXAM_WINDOW: { label: "Exam window", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  EVENT: { label: "School event", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CalendarClient({ events }: { events: Ev[] }) {
  const [showForm, setShowForm] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const byMonth = events.reduce<Record<string, Ev[]>>((acc, e) => {
    const key = new Date(e.startDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    (acc[key] = acc[key] || []).push(e);
    return acc;
  }, {});

  function runSync(which: "national" | "ib") {
    setPending(which);
    setSyncMsg(null);
    startTransition(async () => {
      const res = which === "national" ? await syncNationalCalendar() : await syncIBExamWindows();
      setSyncMsg(
        res.added > 0
          ? `${res.added} new ${which === "national" ? "national holidays / term dates" : "IB exam windows"} imported.`
          : "Already up to date — nothing new to import."
      );
      setPending(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Sync + add toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <button
          onClick={() => runSync("national")}
          disabled={pending !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {pending === "national" ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
          Sync national calendar (India / Karnataka)
        </button>
        <button
          onClick={() => runSync("ib")}
          disabled={pending !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {pending === "ib" ? <Loader2 size={14} className="animate-spin" /> : <Landmark size={14} />}
          Sync IB exam windows
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus size={14} /> Add event
        </button>
      </div>

      {syncMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={15} /> {syncMsg}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500 text-sm">
          <CalendarDays className="mx-auto mb-3 text-slate-400" size={32} />
          Calendar is empty — run the national calendar sync to import terms and holidays.
        </div>
      ) : (
        Object.entries(byMonth).map(([month, evs]) => (
          <div key={month} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{month}</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
              {evs.map((e) => {
                const meta = TYPE_META[e.type] || TYPE_META.EVENT;
                return (
                  <div key={e.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{new Date(e.startDate).getDate()}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{new Date(e.startDate).toLocaleDateString("en-GB", { weekday: "short" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {fmt(e.startDate)}{e.endDate ? ` → ${fmt(e.endDate)}` : ""}
                        {e.notes ? ` · ${e.notes}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                    {e.source !== "SCHOOL" && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <RefreshCw size={9} /> {e.source}
                      </span>
                    )}
                    <button
                      onClick={() => startTransition(() => deleteCalendarEvent(e.id).then(() => {}))}
                      className="p-1.5 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Add Calendar Event</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form
              action={(fd) => startTransition(async () => { await addCalendarEvent(fd); setShowForm(false); })}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
                <input name="title" required placeholder="e.g. MYP Science Fair" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                  <select name="type" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                    <option value="EVENT">School event</option>
                    <option value="HOLIDAY">School holiday</option>
                    <option value="EXAM_WINDOW">Exam window</option>
                    <option value="TERM">Term</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Start date</label>
                  <input type="date" name="startDate" required className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">End date (optional)</label>
                  <input type="date" name="endDate" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</label>
                  <input name="notes" placeholder="Optional" className="mt-1 w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Add Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
