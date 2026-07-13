import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookOpen, Award, Globe2, Lightbulb, HeartHandshake, Trophy, Target } from "lucide-react";

export const dynamic = "force-dynamic";

const GROUP_NAMES: Record<number, string> = {
  1: "Group 1 · Studies in Language & Literature",
  2: "Group 2 · Language Acquisition",
  3: "Group 3 · Individuals & Societies",
  4: "Group 4 · Sciences",
  5: "Group 5 · Mathematics",
  6: "Group 6 · The Arts",
};

const GRADE_LABELS: Record<number, string> = {
  7: "Outstanding", 6: "Excellent", 5: "Very good", 4: "Good", 3: "Pass", 2: "Weak", 1: "Fail",
};

function gradeColor(g: number | null | undefined) {
  if (!g) return "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400";
  if (g >= 6) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (g >= 4) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

// Official-style TOK/EE core points matrix (simplified)
function corePoints(tok?: string | null, ee?: string | null): number {
  if (!tok || !ee) return 0;
  const m: Record<string, number> = {
    "A A": 3, "A B": 3, "B A": 3, "A C": 2, "C A": 2, "A D": 2, "D A": 2,
    "B B": 2, "B C": 1, "C B": 1, "B D": 1, "D B": 1, "C C": 1, "C D": 0, "D C": 0, "D D": 0,
  };
  return m[`${tok} ${ee}`] ?? 0;
}

export default async function StudentGrades() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      ibSubjects: { orderBy: { subjectGroup: "asc" } },
      ibCore: true,
    },
  });
  if (!student) redirect("/student");

  const subjects = student.ibSubjects;
  const tok = student.ibCore.find((c) => c.element === "TOK");
  const ee = student.ibCore.find((c) => c.element === "EE");
  const cas = student.ibCore.find((c) => c.element === "CAS");

  const isDP = student.curriculum === "DP";
  const isMYP = student.curriculum === "MYP";

  const subjectPoints = subjects.reduce((n, s) => n + (s.currentGrade || 0), 0);
  const bonus = corePoints(tok?.grade, ee?.grade);
  const total = subjectPoints + bonus;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title={isDP ? "My Grades — IB Diploma Programme" : isMYP ? "My Grades — IB MYP" : "My Learning — IB PYP"}
        description={
          isDP
            ? `${student.ibSubjects[0]?.term || "Current term"} · IB 1–7 scale · predicted grades updated by your teachers`
            : isMYP
            ? "Criterion-based assessment: Criteria A–D (0–8) convert to your final 1–7 grade per subject."
            : "The PYP uses continuous assessment — observations, projects and reflections rather than formal exams."
        }
      />

      {isDP && (
        <>
          {/* Diploma points summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-sm text-white">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wide"><Trophy size={14} /> Diploma Points (current)</div>
              <p className="text-4xl font-bold mt-2">{total} <span className="text-lg font-normal text-blue-100">/ 45</span></p>
              <p className="text-xs text-blue-100 mt-1">{subjectPoints}/42 from 6 subjects + {bonus}/3 TOK & EE bonus</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide"><Target size={14} /> Predicted Total</div>
              <p className="text-4xl font-bold mt-2 text-slate-800 dark:text-slate-100">
                {subjects.reduce((n, s) => n + (s.predictedGrade || 0), 0) + bonus} <span className="text-lg font-normal text-slate-400">/ 45</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Used for university applications</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide"><Award size={14} /> Diploma Requirements</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <li>{subjects.filter((s) => s.level === "HL").length}× HL, {subjects.filter((s) => s.level === "SL").length}× SL subjects ✓</li>
                <li>TOK: {tok?.status.replace("_", " ").toLowerCase() || "—"} · EE: {ee?.status.replace("_", " ").toLowerCase() || "—"}</li>
                <li>CAS: {cas ? "on track" : "—"} (required, not scored)</li>
              </ul>
            </div>
          </div>

          {/* Subjects by group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((s) => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{GROUP_NAMES[s.subjectGroup]}</p>
                <div className="flex items-start justify-between mt-1 gap-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.subjectName}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.level === "HL" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"}`}>
                    {s.level}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${gradeColor(s.currentGrade)}`}>
                    {s.currentGrade ?? "—"}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{s.currentGrade ? GRADE_LABELS[s.currentGrade] : "Not yet graded"}</p>
                    <p className="text-xs text-slate-500">Predicted: <span className="font-bold">{s.predictedGrade ?? "—"}/7</span></p>
                  </div>
                </div>
                {s.teacherComment && <p className="text-xs text-slate-500 mt-3 italic">&ldquo;{s.teacherComment}&rdquo;</p>}
              </div>
            ))}
          </div>

          {/* DP Core */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">DP Core — TOK · EE · CAS</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2"><Lightbulb size={16} className="text-amber-500" /><span className="font-bold text-sm text-slate-800 dark:text-slate-100">Theory of Knowledge</span></div>
                <p className="text-xs text-slate-500 mb-2">{tok?.title || "Essay title TBC"}</p>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${gradeColor(tok?.grade === "A" ? 7 : tok?.grade === "B" ? 6 : 4)}`}>Current: {tok?.grade || "—"} (A–E)</span>
                <p className="text-[11px] text-slate-400 mt-2">Status: {tok?.status.replace("_", " ").toLowerCase()}</p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2"><BookOpen size={16} className="text-blue-500" /><span className="font-bold text-sm text-slate-800 dark:text-slate-100">Extended Essay</span></div>
                <p className="text-xs text-slate-500 mb-2">{ee?.title || "Research question TBC"}</p>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${gradeColor(ee?.grade === "A" ? 7 : ee?.grade === "B" ? 6 : 4)}`}>Current: {ee?.grade || "—"} (A–E)</span>
                <p className="text-[11px] text-slate-400 mt-2">4,000-word research paper · Status: {ee?.status.replace("_", " ").toLowerCase()}</p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2"><HeartHandshake size={16} className="text-rose-500" /><span className="font-bold text-sm text-slate-800 dark:text-slate-100">CAS</span></div>
                {[
                  { label: "Creativity", val: cas?.creativityHours || 0, color: "bg-purple-500" },
                  { label: "Activity", val: cas?.activityHours || 0, color: "bg-emerald-500" },
                  { label: "Service", val: cas?.serviceHours || 0, color: "bg-blue-500" },
                ].map((s) => (
                  <div key={s.label} className="mb-2">
                    <div className="flex justify-between text-[11px] text-slate-500"><span>{s.label}</span><span className="font-bold">{s.val}h</span></div>
                    <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full ${s.color}`} style={{ width: `${Math.min(100, (s.val / 50) * 100)}%` }} /></div>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 mt-2">{cas?.reflections || 0} reflections logged · CAS is required but carries no points</p>
              </div>
            </div>
          </div>
        </>
      )}

      {isMYP && (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"><Globe2 size={20} /></div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Every MYP subject is assessed against four criteria (A–D), each scored 0–8 by your teachers.
              The four criterion levels combine to give your final <b>1–7 grade</b> — so you can see exactly which skill to improve.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((s) => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.subjectName}</h3>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${gradeColor(s.currentGrade)}`}>{s.currentGrade ?? "—"}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { k: "A", v: s.critA }, { k: "B", v: s.critB }, { k: "C", v: s.critC }, { k: "D", v: s.critD },
                  ].map((c) => (
                    <div key={c.k} className="text-center bg-slate-50 dark:bg-zinc-800/50 rounded-xl py-2">
                      <p className="text-[10px] font-bold text-slate-400">Criterion {c.k}</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{c.v ?? "—"}<span className="text-[10px] text-slate-400 font-normal">/8</span></p>
                    </div>
                  ))}
                </div>
                {s.teacherComment && <p className="text-xs text-slate-500 mt-3 italic">&ldquo;{s.teacherComment}&rdquo;</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {!isDP && !isMYP && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm text-center space-y-3">
          <Globe2 size={40} className="mx-auto text-blue-500 opacity-60" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">PYP learners don&apos;t receive formal grades</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Your learning is documented through portfolios, unit-of-inquiry projects, teacher observations and student-led
            conferences. Ask your teacher to see your latest portfolio entries, or check your homework tab for current
            unit tasks under themes like <i>Sharing the Planet</i> and <i>How the World Works</i>.
          </p>
        </div>
      )}
    </div>
  );
}
