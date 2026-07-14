import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookOpen, TrendingUp, TrendingDown, Minus, HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  let classroom = teacher
    ? await prisma.classroom.findFirst({ where: { teacherId: teacher.id } })
    : null;
  if (!classroom) classroom = await prisma.classroom.findFirst({ where: { students: { some: {} } } });
  if (!classroom) {
    return (
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        <PageHeader title="Class Reports" description="Academic performance summaries for your classes." />
        <p className="text-sm text-slate-400">No classes found.</p>
      </div>
    );
  }

  const students = await prisma.student.findMany({
    where: { classroomId: classroom.id, isActive: true },
    include: {
      assessmentResults: { orderBy: { date: "asc" } },
      attendances: true,
      iepPlans: { where: { status: { not: "ARCHIVED" } }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows = students.map((s) => {
    const res = s.assessmentResults;
    const avg = res.length ? res.reduce((n, r) => n + r.grade, 0) / res.length : null;
    const half = Math.floor(res.length / 2);
    const early = res.slice(0, half);
    const late = res.slice(half);
    const trend =
      early.length && late.length
        ? late.reduce((n, r) => n + r.grade, 0) / late.length - early.reduce((n, r) => n + r.grade, 0) / early.length
        : 0;
    const present = s.attendances.filter((a) => a.status === "PRESENT").length;
    const attPct = s.attendances.length ? Math.round((present / s.attendances.length) * 100) : null;
    return {
      id: s.id,
      name: s.name,
      registrationNo: s.registrationNo,
      curriculum: s.curriculum,
      avg: avg !== null ? Math.round(avg * 10) / 10 : null,
      trend,
      attPct,
      assessments: res.length,
      hasIEP: s.iepPlans.length > 0 || !!s.learningNeeds,
    };
  });

  const classAvg = rows.filter((r) => r.avg !== null);
  const overallAvg = classAvg.length ? Math.round((classAvg.reduce((n, r) => n + (r.avg || 0), 0) / classAvg.length) * 10) / 10 : null;
  const attRows = rows.filter((r) => r.attPct !== null);
  const overallAtt = attRows.length ? Math.round(attRows.reduce((n, r) => n + (r.attPct || 0), 0) / attRows.length) : null;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title={`Class Report — ${classroom.name}`}
        description="Live academic summary from assessment results and attendance. IB 1–7 scale."
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Students", value: rows.length },
          { label: "Class average (1–7)", value: overallAvg ?? "—" },
          { label: "Attendance", value: overallAtt !== null ? `${overallAtt}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-left">
              {["Student", "Programme", "Avg grade", "Trend", "Attendance", "Assessments"].map((h) => (
                <th key={h} className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {r.name}
                    {r.hasIEP && <HeartHandshake size={13} className="text-rose-500" />}
                  </p>
                  <p className="text-[11px] text-slate-400">{r.registrationNo}</p>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.curriculum}</td>
                <td className="px-5 py-3">
                  <span className={`font-bold ${r.avg === null ? "text-slate-400" : r.avg >= 6 ? "text-emerald-600 dark:text-emerald-400" : r.avg >= 4 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {r.avg ?? "—"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {r.trend > 0.2 ? <TrendingUp size={16} className="text-emerald-500" /> : r.trend < -0.2 ? <TrendingDown size={16} className="text-red-500" /> : <Minus size={16} className="text-slate-400" />}
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.attPct !== null ? `${r.attPct}%` : "—"}</td>
                <td className="px-5 py-3 text-slate-500">{r.assessments}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm flex items-center justify-center gap-2"><BookOpen size={16} /> No students in this class.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
