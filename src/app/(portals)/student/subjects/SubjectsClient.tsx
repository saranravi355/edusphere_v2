"use client";

import { useMemo, useState } from "react";
import {
  BookOpen, FileText, Video, Link2, FileSpreadsheet, GraduationCap,
  TrendingUp, TrendingDown, Minus, Download, ClipboardCheck,
} from "lucide-react";

interface SubjectRow {
  subjectName: string;
  subjectGroup: number;
  level: string;
  currentGrade: number | null;
  predictedGrade: number | null;
  critA: number | null;
  critB: number | null;
  critC: number | null;
  critD: number | null;
  teacherComment: string | null;
}

interface ResultRow {
  id: string;
  subjectName: string;
  title: string;
  type: string;
  date: string;
  grade: number;
  maxGrade: number;
  comment: string | null;
  term: string;
}

interface ResourceRow {
  id: string;
  subjectName: string;
  title: string;
  type: string;
  description: string | null;
  url: string | null;
  addedBy: string | null;
}

const GROUP_NAMES: Record<number, string> = {
  1: "Group 1 · Language & Literature",
  2: "Group 2 · Language Acquisition",
  3: "Group 3 · Individuals & Societies",
  4: "Group 4 · Sciences",
  5: "Group 5 · Mathematics",
  6: "Group 6 · The Arts",
};

const RESOURCE_META: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  NOTES: { icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Notes" },
  PAST_PAPER: { icon: FileSpreadsheet, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", label: "Past paper" },
  VIDEO: { icon: Video, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400", label: "Video" },
  LINK: { icon: Link2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Link" },
  WORKSHEET: { icon: Download, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400", label: "Worksheet" },
};

const TYPE_LABEL: Record<string, string> = {
  FORMATIVE: "Formative",
  SUMMATIVE: "Summative",
  MOCK: "Mock exam",
  IA_DRAFT: "IA draft",
  ORAL: "Oral",
};

function gradeColor(g: number) {
  if (g >= 6) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (g >= 4) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

export default function SubjectsClient({
  subjects,
  results,
  resources,
  initialSubject,
}: {
  subjects: SubjectRow[];
  results: ResultRow[];
  resources: ResourceRow[];
  initialSubject?: string;
}) {
  const [active, setActive] = useState<string>(initialSubject ?? "ALL");

  const shown = active === "ALL" ? subjects : subjects.filter((s) => s.subjectName === active);

  const bySubject = useMemo(() => {
    const map: Record<string, { results: ResultRow[]; resources: ResourceRow[] }> = {};
    for (const s of subjects) map[s.subjectName] = { results: [], resources: [] };
    for (const r of results) map[r.subjectName]?.results.push(r);
    for (const r of resources) map[r.subjectName]?.resources.push(r);
    return map;
  }, [subjects, results, resources]);

  return (
    <div className="space-y-6">
      {/* Subject filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActive("ALL")}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
            active === "ALL" ? "bg-blue-600 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          All subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s.subjectName}
            onClick={() => setActive(s.subjectName)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
              active === s.subjectName ? "bg-blue-600 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {s.subjectName}
          </button>
        ))}
      </div>

      {shown.map((s) => {
        const data = bySubject[s.subjectName];
        const hist = data.results;
        const first = hist[0]?.grade;
        const last = hist[hist.length - 1]?.grade;
        const trend = hist.length >= 2 ? last - first : 0;

        return (
          <div key={s.subjectName} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Subject header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {s.level === "MYP" ? "IB MYP" : GROUP_NAMES[s.subjectGroup]}
                </p>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  {s.subjectName}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.level === "HL" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"}`}>
                    {s.level}
                  </span>
                </h3>
                {s.teacherComment && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{s.teacherComment}&rdquo;</p>}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className={`text-2xl font-bold px-3 py-1 rounded-xl ${s.currentGrade ? gradeColor(s.currentGrade) : "text-slate-400"}`}>{s.currentGrade ?? "—"}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Current</p>
                </div>
                {s.predictedGrade !== null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{s.predictedGrade}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Predicted</p>
                  </div>
                )}
                <div className="text-center">
                  {trend > 0 ? <TrendingUp className="text-emerald-500 mx-auto" size={22} /> : trend < 0 ? <TrendingDown className="text-red-500 mx-auto" size={22} /> : <Minus className="text-slate-400 mx-auto" size={22} />}
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Trend</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-zinc-800">
              {/* Grade history & assessment results */}
              <div className="p-6">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ClipboardCheck size={15} className="text-blue-600" /> Grade history & assessments
                  <span className="text-[10px] font-normal text-slate-400">({hist.length} results)</span>
                </h4>

                {hist.length === 0 ? (
                  <p className="text-xs text-slate-400">No assessments recorded yet.</p>
                ) : (
                  <>
                    {/* mini bar chart */}
                    <div className="flex items-end gap-1.5 mb-5 border-b border-slate-100 dark:border-zinc-800 pb-1">
                      {hist.map((r) => (
                        <div key={r.id} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${r.title}: ${r.grade}/${r.maxGrade}`}>
                          <span className={`text-[10px] font-bold ${r.grade >= 6 ? "text-emerald-600 dark:text-emerald-400" : r.grade >= 4 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>{r.grade}</span>
                          <div
                            className={`w-full max-w-[38px] rounded-t-md ${r.grade >= 6 ? "bg-emerald-400" : r.grade >= 4 ? "bg-blue-400" : "bg-amber-400"}`}
                            style={{ height: `${Math.max(6, (r.grade / r.maxGrade) * 64)}px` }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {[...hist].reverse().map((r) => (
                        <div key={r.id} className="flex items-start gap-3">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${gradeColor(r.grade)}`}>{r.grade}<span className="text-[9px] font-normal">/{r.maxGrade}</span></span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {TYPE_LABEL[r.type] || r.type} · {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })} · {r.term}
                            </p>
                            {r.comment && <p className="text-[11px] text-slate-500 italic mt-0.5">{r.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Resources */}
              <div className="p-6">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <BookOpen size={15} className="text-purple-600" /> Subject resources
                  <span className="text-[10px] font-normal text-slate-400">({data.resources.length})</span>
                </h4>
                {data.resources.length === 0 ? (
                  <p className="text-xs text-slate-400">Your teacher hasn&apos;t shared resources yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.resources.map((r) => {
                      const meta = RESOURCE_META[r.type] || RESOURCE_META.NOTES;
                      return (
                        <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                            <meta.icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{r.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {meta.label}{r.addedBy ? ` · shared by ${r.addedBy}` : ""}
                            </p>
                            {r.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{r.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {subjects.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500 text-sm">
          <GraduationCap className="mx-auto mb-3 text-slate-400" size={32} />
          No subjects enrolled yet — speak to your programme coordinator.
        </div>
      )}
    </div>
  );
}
