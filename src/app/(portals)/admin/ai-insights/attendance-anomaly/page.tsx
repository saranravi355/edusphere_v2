"use client";

import PageHeader from "@/components/ui/PageHeader";
import { useAIScan } from "@/lib/useAIScan";
import { ScanLine, Sparkles, CalendarX2 } from "lucide-react";

const anomalies = [
  { name: "Kabir Singh", grade: "MYP3", pattern: "Absent every Monday for 4 consecutive weeks", confidence: 92 },
  { name: "Sara Thomas", grade: "DP1", pattern: "Sudden drop from 98% to 71% attendance after half-term break", confidence: 87 },
  { name: "Wing 2B Cohort", grade: "MYP2", pattern: "Unusual block-absence spike during Period 5 (PE) only", confidence: 79 },
  { name: "Devansh Rao", grade: "DP2", pattern: "Late check-ins clustered before Theory of Knowledge periods", confidence: 84 },
];

export default function AttendanceAnomalyPage() {
  const { running, complete, run } = useAIScan(2300);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Attendance Anomaly Detector"
        description="Detects unusual attendance patterns across the school — beyond simple absence-rate thresholds — that may indicate disengagement, bullying, or scheduling issues."
      />

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/40">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ScanLine size={150} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-sky-300" /> Pattern Scanner
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
            Runs anomaly detection over daily attendance logs for every homeroom, comparing each student against their own rolling baseline rather than a fixed threshold.
          </p>
          <button
            onClick={run}
            disabled={running}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {running ? <><ScanLine size={18} className="animate-spin" /> Scanning Logs...</> : <><ScanLine size={18} /> Run Anomaly Scan</>}
          </button>
        </div>
      </div>

      {complete && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CalendarX2 size={16} className="text-orange-500" /> Detected Anomalies
          </h3>
          {anomalies.map((a, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{a.name} <span className="text-xs text-slate-400 font-normal">· {a.grade}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{a.pattern}</p>
              </div>
              <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full text-xs font-bold font-mono shrink-0">
                {a.confidence}% confidence
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
