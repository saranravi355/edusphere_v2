"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Globe2, BookOpen, Trophy, AlertTriangle, HeartHandshake,
  CalendarClock, ArrowRight, Lightbulb, Target,
} from "lucide-react";

interface DPData {
  cohort: number;
  avgPoints: number;
  below24: number;
  graded: number;
  groupAvgs: { group: number; avg: number }[];
  ee: { SUBMITTED: number; IN_PROGRESS: number; OTHER: number };
  casOnTrack: number;
  casTotal: number;
  upcoming: { session: string; subject: string; paper: string; date: string }[];
}

interface MYPData {
  cohort: number;
  avgGrade: number;
  critAvgs: number[];
  subjectAvgs: { name: string; avg: number }[];
  upcoming: { session: string; subject: string; paper: string; date: string }[];
}

interface Data {
  counts: { PYP: number; MYP: number; DP: number; OTHER: number };
  dp: DPData;
  myp: MYPData;
  pyp: { cohort: number };
}

const GROUP_SHORT: Record<number, string> = {
  1: "Lang & Lit", 2: "Lang Acq", 3: "Ind & Soc", 4: "Sciences", 5: "Maths", 6: "Arts",
};

const PYP_THEMES = [
  { theme: "Who We Are", units: 3, done: 2 },
  { theme: "Where We Are in Place & Time", units: 3, done: 2 },
  { theme: "How We Express Ourselves", units: 3, done: 1 },
  { theme: "How the World Works", units: 3, done: 2 },
  { theme: "How We Organize Ourselves", units: 3, done: 1 },
  { theme: "Sharing the Planet", units: 3, done: 1 },
];

function Stat({ icon: Icon, color, value, label }: { icon: typeof Trophy; color: string; value: string | number; label: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function ProgrammesClient({ data }: { data: Data }) {
  const [tab, setTab] = useState<"DP" | "MYP" | "PYP">("DP");

  return (
    <div className="space-y-6">
      {/* Programme tabs */}
      <div className="flex gap-2">
        {(["DP", "MYP", "PYP"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors ${
              tab === t ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            {t} <span className={`ml-1 text-xs font-normal ${tab === t ? "text-blue-100" : "text-slate-400"}`}>
              {data.counts[t]} students
            </span>
          </button>
        ))}
      </div>

      {tab === "DP" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={Trophy} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" value={`${data.dp.avgPoints}/45`} label="Average diploma points" />
            <Stat icon={AlertTriangle} color="text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" value={data.dp.below24} label="Below 24-point pass line" />
            <Stat icon={BookOpen} color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" value={`${data.dp.ee.SUBMITTED}/${data.dp.ee.SUBMITTED + data.dp.ee.IN_PROGRESS + data.dp.ee.OTHER}`} label="Extended Essays submitted" />
            <Stat icon={HeartHandshake} color="text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" value={`${data.dp.casOnTrack}/${data.dp.casTotal}`} label="CAS on track" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group averages */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Target size={16} className="text-blue-600" /> Average grade by subject group
              </h3>
              <div className="space-y-3">
                {data.dp.groupAvgs.sort((a, b) => a.group - b.group).map((g) => (
                  <div key={g.group}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Group {g.group} · {GROUP_SHORT[g.group]}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{g.avg}/7</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${g.avg >= 6 ? "bg-emerald-500" : g.avg >= 5 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${(g.avg / 7) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming + links */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <CalendarClock size={16} className="text-purple-600" /> Upcoming DP assessments
                </h3>
                <div className="space-y-2">
                  {data.dp.upcoming.map((e, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-300 truncate">{e.subject} — {e.paper}</span>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/admin/programmes/cas" className="group block">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HeartHandshake size={20} />
                    <div>
                      <p className="font-bold text-sm">CAS Coordinator view</p>
                      <p className="text-xs text-rose-100">Strand hours, reflections and nudges per student</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {tab === "MYP" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat icon={GraduationCap} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" value={data.myp.cohort} label="MYP students" />
            <Stat icon={Trophy} color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" value={`${data.myp.avgGrade}/7`} label="Average grade" />
            <Stat icon={Target} color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" value={data.myp.critAvgs.length ? `${Math.min(...data.myp.critAvgs)}/8` : "—"} label="Weakest criterion average" />
            <Stat icon={CalendarClock} color="text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" value={data.myp.upcoming.length} label="Upcoming eAssessments" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Criterion averages across all subjects (0–8)</h3>
              <div className="grid grid-cols-4 gap-3">
                {["A", "B", "C", "D"].map((k, i) => (
                  <div key={k} className="text-center bg-slate-50 dark:bg-zinc-800/50 rounded-xl py-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Criterion {k}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data.myp.critAvgs[i] ?? "—"}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                A: Knowing & understanding · B: Inquiring/Developing · C: Processing/Creating · D: Applying/Evaluating (varies by subject group)
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Average grade by subject</h3>
              <div className="space-y-3">
                {data.myp.subjectAvgs.slice(0, 6).map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(s.avg * 10) / 10}/7</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.avg >= 6 ? "bg-emerald-500" : s.avg >= 5 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${(s.avg / 7) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "PYP" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat icon={GraduationCap} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" value={data.pyp.cohort} label="PYP learners" />
            <Stat icon={Globe2} color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" value={6} label="Transdisciplinary themes" />
            <Stat icon={Lightbulb} color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" value={`${PYP_THEMES.reduce((n, t) => n + t.done, 0)}/${PYP_THEMES.reduce((n, t) => n + t.units, 0)}`} label="Units of inquiry completed" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Programme of Inquiry — unit progress</h3>
            <p className="text-xs text-slate-400 mb-4">PYP is transdisciplinary: learning is organised under six themes rather than subjects. No formal grades — progress is documented via portfolios and student-led conferences.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PYP_THEMES.map((t) => (
                <div key={t.theme}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{t.theme}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{t.done}/{t.units} units</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(t.done / t.units) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
