import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import IncidentForm from "./IncidentForm";
import { conductTotal, ESCALATION_THRESHOLD, findCategory } from "@/lib/behavior";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Behavioural Disciplinary Engine.
 *
 * Every part of this page was theatre. The form did not submit — see
 * actions.ts. The "Recent Behavior Logs" table was three invented rows with
 * fixed dates while BehaviorIncident sat unqueried. And the red "Critical
 * Action Required" banner announced that a named student had crossed the −20
 * threshold and been placed on a suspension warning; it was hardcoded markup,
 * shown to every teacher, about a student who is not in the roll.
 *
 * The banner is computed now, from the teacher's own students, and only appears
 * when somebody has actually crossed the line.
 */
export default async function TeacherDisciplineEngine() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      classes: { select: { id: true, name: true, students: { select: { id: true, name: true }, orderBy: { name: "asc" } } } },
    },
  });
  if (!teacher) redirect("/teacher");

  const students = teacher.classes.flatMap((c) => c.students.map((s) => ({ ...s, classroom: c.name })));
  const studentIds = students.map((s) => s.id);

  const [incidents, allForTotals] = studentIds.length
    ? await Promise.all([
        prisma.behaviorIncident.findMany({
          where: { studentId: { in: studentIds } },
          select: {
            id: true, type: true, category: true, description: true, points: true, date: true,
            student: { select: { id: true, name: true } },
            teacher: { select: { user: { select: { name: true } } } },
          },
          orderBy: { date: "desc" },
          take: 25,
        }),
        prisma.behaviorIncident.findMany({
          where: { studentId: { in: studentIds } },
          select: { studentId: true, type: true, points: true },
        }),
      ])
    : [[], []];

  // Running conduct total per student, so escalation is a fact rather than copy.
  const totals = new Map<string, number>();
  for (const s of students) totals.set(s.id, 0);
  for (const i of allForTotals) {
    totals.set(i.studentId, (totals.get(i.studentId) ?? 0) + conductTotal([{ type: i.type, points: i.points }]));
  }
  const atRisk = students
    .map((s) => ({ ...s, total: totals.get(s.id) ?? 0 }))
    .filter((s) => s.total <= ESCALATION_THRESHOLD)
    .sort((a, b) => a.total - b.total);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Behavioural Disciplinary Engine"
        description="Log student incidents, award behaviour points, and alert parents."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <IncidentForm students={students} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {atRisk.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex gap-4">
              <div className="mt-1"><AlertTriangle className="text-red-500" size={24} aria-hidden /></div>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-400">
                  {atRisk.length === 1 ? "A student needs review" : `${atRisk.length} students need review`}
                </h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1 mb-3">
                  {atRisk.map((s) => `${s.name} (${s.total})`).join(", ")}{" "}
                  {atRisk.length === 1 ? "is" : "are"} at or below {ESCALATION_THRESHOLD} conduct points. Escalation is a
                  decision for the Principal, not something this screen applies automatically.
                </p>
                <Link
                  href="/admin/behavior"
                  className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
                >
                  Open the school conduct record
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap gap-2 justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert size={18} className="text-slate-500" aria-hidden />
                Recent behaviour logs
              </h3>
              <span className="text-xs text-slate-500">
                {students.length} student{students.length === 1 ? "" : "s"} across{" "}
                {teacher.classes.length} class{teacher.classes.length === 1 ? "" : "es"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Note</th>
                    <th className="p-4 font-medium text-right">Points</th>
                    <th className="p-4 font-medium">Logged by</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {incidents.map((i) => {
                    const cat = findCategory(i.category);
                    const merit = i.type === "MERIT";
                    return (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20">
                        <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">{i.student.name}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{cat?.label ?? i.category}</td>
                        <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={i.description}>{i.description}</td>
                        <td className={`p-4 text-sm text-right font-bold tabular-nums ${merit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {merit ? "+" : "−"}{Math.abs(i.points)}
                        </td>
                        <td className="p-4 text-sm text-slate-500">{i.teacher.user.name}</td>
                        <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(i.date, "dMonYy")}</td>
                      </tr>
                    );
                  })}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-sm text-slate-500">
                        {students.length === 0
                          ? "No classes are assigned to you yet."
                          : "Nothing logged for your classes yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
