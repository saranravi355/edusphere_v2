"use client";

import { Star, MessageSquareText, Users } from "lucide-react";

type Summary = { count: number; classConduct: number; explanation: number; communication: number; support: number };
type Item = {
  id: string;
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

function StarsReadOnly({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300 dark:text-zinc-700"} />
      ))}
    </div>
  );
}

function AverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <StarsReadOnly value={value} />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function TeacherFeedbackReceivedClient({ summary, items }: { summary: Summary; items: Item[] }) {
  if (summary.count === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-slate-500 text-sm">
        <Users className="mx-auto mb-2 text-slate-400" size={28} />
        No feedback submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Average ratings</h3>
          <span className="text-[11px] text-slate-400">{summary.count} response{summary.count === 1 ? "" : "s"}</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
          <AverageRow label="Class conduct" value={summary.classConduct} />
          <AverageRow label="Explaining concepts" value={summary.explanation} />
          <AverageRow label="Communication" value={summary.communication} />
          <AverageRow label="Student support" value={summary.support} />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">All responses</h3>
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Anonymous student</span>
                <span className="text-[11px] text-slate-400">{fmt(f.updatedAt)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Class conduct</p>
                  <StarsReadOnly value={f.classConductRating} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Explanation</p>
                  <StarsReadOnly value={f.explanationRating} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Communication</p>
                  <StarsReadOnly value={f.communicationRating} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Support</p>
                  <StarsReadOnly value={f.supportRating} />
                </div>
              </div>
              {f.comment && (
                <div className="flex items-start gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <MessageSquareText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{f.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
