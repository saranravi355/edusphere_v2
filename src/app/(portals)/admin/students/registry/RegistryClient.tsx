"use client";

import { useMemo, useState } from "react";
import {
  Search, GraduationCap, Users, HeartHandshake, Sparkles, X,
  BrainCircuit, TrendingUp, ShieldAlert, Loader2, Download, ChevronDown,
} from "lucide-react";

interface Row {
  id: string;
  name: string;
  registrationNo: string;
  curriculum: string;
  gender: string | null;
  classroom: string | null;
  parentName: string | null;
  parentPhone: string | null;
  enrollmentDate: string;
  hasIEP: boolean;
  isActive: boolean;
}

type AIAction = "summary" | "risk" | "forecast";

const AI_ACTIONS: { id: AIAction; name: string; description: string; icon: typeof Sparkles }[] = [
  { id: "summary", name: "Cohort Summary", description: "Narrative overview of the filtered cohort", icon: BrainCircuit },
  { id: "risk", name: "At-Risk Scan", description: "Flag students needing early intervention", icon: ShieldAlert },
  { id: "forecast", name: "Enrolment Forecast", description: "Projected intake for next academic year", icon: TrendingUp },
];

const PROGRAMMES = ["ALL", "PYP", "MYP", "DP"];

export default function RegistryClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [programme, setProgramme] = useState("ALL");
  const [iepOnly, setIepOnly] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiRunning, setAiRunning] = useState<AIAction | null>(null);
  const [aiResult, setAiResult] = useState<{ action: AIAction; lines: string[] } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if (programme !== "ALL" && r.curriculum !== programme) return false;
      if (iepOnly && !r.hasIEP) return false;
      if (q && !(`${r.name} ${r.registrationNo} ${r.classroom || ""} ${r.parentName || ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, programme, iepOnly]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.isActive).length;
    const iep = rows.filter((r) => r.hasIEP).length;
    const dp = rows.filter((r) => r.curriculum === "DP").length;
    const myp = rows.filter((r) => r.curriculum === "MYP").length;
    const pyp = rows.filter((r) => r.curriculum === "PYP").length;
    return { active, iep, dp, myp, pyp, total: rows.length };
  }, [rows]);

  // ── Mock Platform AI (preview) — canned analysis computed from real data ──
  function runAI(action: AIAction) {
    setAiRunning(action);
    setAiResult(null);
    const cohort = filtered;
    setTimeout(() => {
      let lines: string[] = [];
      if (action === "summary") {
        const boys = cohort.filter((r) => r.gender?.toLowerCase().startsWith("m")).length;
        const girls = cohort.filter((r) => r.gender?.toLowerCase().startsWith("f")).length;
        const iep = cohort.filter((r) => r.hasIEP).length;
        const classes = new Set(cohort.map((r) => r.classroom).filter(Boolean)).size;
        lines = [
          `This cohort contains ${cohort.length} students across ${classes} class sections.`,
          `Programme mix: ${cohort.filter((r) => r.curriculum === "PYP").length} PYP, ${cohort.filter((r) => r.curriculum === "MYP").length} MYP, ${cohort.filter((r) => r.curriculum === "DP").length} DP.`,
          `Gender balance: ${boys} male / ${girls} female${boys + girls < cohort.length ? " (some records unspecified)" : ""}.`,
          `${iep} student${iep === 1 ? "" : "s"} (${cohort.length ? Math.round((iep / cohort.length) * 100) : 0}%) have an active IEP or flagged learning need — recommend confirming accommodations are in place before the next assessment window.`,
        ];
      } else if (action === "risk") {
        const flagged = cohort.filter((r) => r.hasIEP).slice(0, 3);
        const sample = cohort.slice(0, 2);
        lines = [
          `Scanned ${cohort.length} students against attendance, grade-trend and wellbeing signals.`,
          ...flagged.map((r) => `⚠ ${r.name} (${r.classroom || "unassigned"}) — active learning-support plan; monitor assessment accommodations.`),
          ...sample.map((r) => `◦ ${r.name} — mild negative grade trend projected; suggest a check-in with the class teacher.`),
          "No students currently meet the high-risk threshold. Next scheduled scan: Monday 06:00.",
        ];
      } else {
        const next = Math.round(stats.total * 1.08);
        lines = [
          `Based on 3-year intake trends and current ${stats.total} enrolments, projected enrolment for AY 2026-27 is ~${next} students (+8%).`,
          `Strongest growth expected in MYP (${stats.myp} → ~${Math.round(stats.myp * 1.12)}), driven by PYP promotion cohort of ${stats.pyp}.`,
          `DP capacity check: ${stats.dp} current DP students; projected ${Math.round(stats.dp * 1.05)} next year remains within a 2-section capacity.`,
          "Recommendation: open MYP waitlist early and confirm one additional Group 4 (Sciences) teacher allocation.",
        ];
      }
      setAiResult({ action, lines });
      setAiRunning(null);
    }, 1400);
  }

  function exportCSV() {
    const head = "Name,Registration No,Programme,Class,Parent,Parent Phone,IEP,Status";
    const body = filtered
      .map((r) =>
        [r.name, r.registrationNo, r.curriculum, r.classroom || "", r.parentName || "", r.parentPhone || "", r.hasIEP ? "Yes" : "No", r.isActive ? "Active" : "Inactive"]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student-registry.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: stats.total, icon: GraduationCap, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Active", value: stats.active, icon: Users, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "IEP / SEN", value: stats.iep, icon: HeartHandshake, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" },
          { label: "PYP / MYP / DP", value: `${stats.pyp}/${stats.myp}/${stats.dp}`, icon: Sparkles, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
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

      {/* Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, reg no, class or parent…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          {PROGRAMMES.map((p) => (
            <button
              key={p}
              onClick={() => setProgramme(p)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                programme === p
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300"
              }`}
            >
              {p === "ALL" ? "All" : p}
            </button>
          ))}
          <button
            onClick={() => setIepOnly((v) => !v)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 ${
              iepOnly
                ? "bg-rose-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300"
            }`}
          >
            <HeartHandshake size={13} /> IEP
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => setAiOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Sparkles size={14} /> Platform AI <ChevronDown size={13} className={`transition-transform ${aiOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Platform AI panel (preview mock) */}
      {aiOpen && (
        <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={15} className="text-purple-600" /> Platform AI
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">PREVIEW</span>
            </p>
            <p className="text-xs text-slate-500">Runs on the {filtered.length} students currently filtered</p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {AI_ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => runAI(a.id)}
                disabled={aiRunning !== null}
                className={`text-left p-4 rounded-xl border transition-all disabled:opacity-60 ${
                  aiResult?.action === a.id
                    ? "border-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
                    : "border-slate-200 dark:border-zinc-700 hover:border-purple-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {aiRunning === a.id ? (
                    <Loader2 size={16} className="text-purple-600 animate-spin" />
                  ) : (
                    <a.icon size={16} className="text-purple-600" />
                  )}
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{a.name}</span>
                </div>
                <p className="text-xs text-slate-500">{a.description}</p>
              </button>
            ))}
          </div>

          {aiResult && (
            <div className="mx-4 mb-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={12} /> {AI_ACTIONS.find((a) => a.id === aiResult.action)?.name} — generated insight
                </p>
                <button onClick={() => setAiResult(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              {aiResult.lines.map((l, i) => (
                <p key={i} className="text-sm text-slate-700 dark:text-slate-300">{l}</p>
              ))}
              <p className="text-[10px] text-slate-400 pt-1">
                Preview mock-up — insights are illustrative and computed from registry data, not a live AI model yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Registry table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-left">
              {["Student", "Reg No", "Programme", "Class", "Parent / Guardian", "Enrolled", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        {r.name}
                        {r.hasIEP && <HeartHandshake size={13} className="text-rose-500" aria-label="Has IEP" />}
                      </p>
                      {r.gender && <p className="text-[11px] text-slate-400">{r.gender}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{r.registrationNo}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                    r.curriculum === "DP"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : r.curriculum === "MYP"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : r.curriculum === "PYP"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"
                  }`}>
                    {r.curriculum}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.classroom || "—"}</td>
                <td className="px-5 py-3">
                  <p className="text-slate-700 dark:text-slate-200">{r.parentName || "—"}</p>
                  {r.parentPhone && <p className="text-[11px] text-slate-400">{r.parentPhone}</p>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{new Date(r.enrollmentDate).toLocaleDateString('en-GB')}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                    r.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400"
                  }`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No students match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 text-right">{filtered.length} of {rows.length} students shown</p>
    </div>
  );
}
