import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Globe2 } from "lucide-react";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const GROUP_NAMES: Record<number, string> = {
  1: "Group 1 — Studies in Language & Literature",
  2: "Group 2 — Language Acquisition",
  3: "Group 3 — Individuals & Societies",
  4: "Group 4 — Sciences",
  5: "Group 5 — Mathematics",
  6: "Group 6 — The Arts",
};

// Simplified official TOK/EE points matrix
function corePoints(tok?: string | null, ee?: string | null): number {
  if (!tok || !ee) return 0;
  const m: Record<string, number> = {
    "A A": 3, "A B": 3, "B A": 3, "A C": 2, "C A": 2, "A D": 2, "D A": 2,
    "B B": 2, "B C": 1, "C B": 1, "B D": 1, "D B": 1, "C C": 1, "C D": 0, "D C": 0, "D D": 0,
  };
  return m[`${tok} ${ee}`] ?? 0;
}

export default async function StudentReportCard() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      classroom: true,
      ibSubjects: { orderBy: { subjectGroup: "asc" } },
      ibCore: true,
    },
  });
  if (!student) redirect("/student");

  const isDP = student.curriculum === "DP";
  const isMYP = student.curriculum === "MYP";
  const subjects = student.ibSubjects;
  const tok = student.ibCore.find((c) => c.element === "TOK");
  const ee = student.ibCore.find((c) => c.element === "EE");
  const cas = student.ibCore.find((c) => c.element === "CAS");

  const currentTotal = subjects.reduce((n, s) => n + (s.currentGrade || 0), 0);
  const predictedTotal = subjects.reduce((n, s) => n + (s.predictedGrade || 0), 0);
  const bonus = corePoints(tok?.grade, ee?.grade);
  const casHours = (cas?.creativityHours || 0) + (cas?.activityHours || 0) + (cas?.serviceHours || 0);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title={isDP ? "IB Diploma Programme Report" : isMYP ? "IB MYP Report" : "IB PYP Learning Report"}
          description={`${subjects[0]?.term || "Term 1 2026-27"} · criterion-referenced, IB 1–7 scale`}
        />
        <PrintButton />
      </div>

      <div id="report-print" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between border-b border-slate-200 dark:border-zinc-800 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">EduSphere 360</h1>
            <p className="text-slate-500 font-medium">IB World School · Official Academic Report</p>
          </div>
          <div className="mt-6 md:mt-0 text-left md:text-right">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{student.name}</h3>
            <p className="text-slate-500">Student ID: {student.registrationNo}</p>
            <p className="text-slate-500">
              {isDP ? "IB Diploma Programme" : isMYP ? "IB Middle Years Programme" : "IB Primary Years Programme"}
              {student.classroom ? ` · ${student.classroom.name}` : ""}
            </p>
          </div>
        </div>

        {isDP && (
          <>
            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-800 dark:border-slate-100 uppercase text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="pb-3 pr-4">Subject group</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 text-center">Level</th>
                    <th className="pb-3 text-center">Grade (1–7)</th>
                    <th className="pb-3 text-center">Predicted</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-zinc-800">
                      <td className="py-3 pr-4 text-xs text-slate-400">{GROUP_NAMES[s.subjectGroup]}</td>
                      <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100">{s.subjectName}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.level === "HL" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"}`}>{s.level}</span>
                      </td>
                      <td className="py-3 text-center text-lg font-bold text-slate-800 dark:text-slate-100">{s.currentGrade ?? "—"}</td>
                      <td className="py-3 text-center text-slate-500 font-bold">{s.predictedGrade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Core + totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 text-sm space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wide">DP Core</p>
                <p className="text-slate-600 dark:text-slate-300">Theory of Knowledge: <b>{tok?.grade || "—"}</b> ({tok?.status.replace("_", " ").toLowerCase() || "not started"})</p>
                <p className="text-slate-600 dark:text-slate-300">Extended Essay: <b>{ee?.grade || "—"}</b> ({ee?.status.replace("_", " ").toLowerCase() || "not started"})</p>
                <p className="text-slate-600 dark:text-slate-300">CAS: <b>{casHours}h logged</b> · {cas?.reflections || 0} reflections — requirement {casHours >= 100 ? "met" : "in progress"}</p>
                <p className="text-xs text-slate-400 pt-1">TOK + EE combine for up to 3 bonus points. CAS is required but not scored.</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Diploma points</p>
                <p className="text-4xl font-black mt-1">{currentTotal + bonus} <span className="text-lg font-normal text-blue-100">/ 45</span></p>
                <p className="text-xs text-blue-100 mt-1">{currentTotal}/42 subjects + {bonus}/3 core bonus · Predicted: {predictedTotal + bonus}/45</p>
                <p className="text-xs text-blue-100 mt-1">Pass threshold: 24 points {currentTotal + bonus >= 24 ? "✓ on track" : ""}</p>
              </div>
            </div>

            {/* Teacher comments */}
            <div className="space-y-3">
              <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wide">Teacher comments</p>
              {subjects.filter((s) => s.teacherComment).map((s) => (
                <p key={s.id} className="text-sm text-slate-600 dark:text-slate-300"><b>{s.subjectName}:</b> {s.teacherComment}</p>
              ))}
            </div>
          </>
        )}

        {isMYP && (
          <>
            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-800 dark:border-slate-100 uppercase text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 text-center">Crit A</th>
                    <th className="pb-3 text-center">Crit B</th>
                    <th className="pb-3 text-center">Crit C</th>
                    <th className="pb-3 text-center">Crit D</th>
                    <th className="pb-3 text-center">Total /32</th>
                    <th className="pb-3 text-center">Grade (1–7)</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const total = (s.critA || 0) + (s.critB || 0) + (s.critC || 0) + (s.critD || 0);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-zinc-800">
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100">{s.subjectName}</td>
                        <td className="py-3 text-center">{s.critA ?? "—"}</td>
                        <td className="py-3 text-center">{s.critB ?? "—"}</td>
                        <td className="py-3 text-center">{s.critC ?? "—"}</td>
                        <td className="py-3 text-center">{s.critD ?? "—"}</td>
                        <td className="py-3 text-center font-bold">{total}</td>
                        <td className="py-3 text-center text-lg font-bold text-slate-800 dark:text-slate-100">{s.currentGrade ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400">
              Each criterion is assessed 0–8 against MYP subject-group objectives. Criterion totals convert to the final 1–7
              grade using the IB grade boundary table. Service as Action and the Personal Project are reported separately.
            </p>
          </>
        )}

        {!isDP && !isMYP && (
          <div className="text-center py-10 space-y-3">
            <Globe2 size={40} className="mx-auto text-blue-500 opacity-60" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">PYP learners receive narrative reports, not grades</h3>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Progress is documented through the learner portfolio, unit-of-inquiry outcomes and teacher observations across
              the transdisciplinary themes. Your full written report and portfolio are shared at student-led conferences.
            </p>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-zinc-800 mt-8 pt-6 flex justify-between text-xs text-slate-400">
          <span>Issued {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span>Grades 1–7 · criterion-referenced · IB World School</span>
        </div>
      </div>
    </div>
  );
}
