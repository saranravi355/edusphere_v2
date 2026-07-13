import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProgrammesClient from "./ProgrammesClient";

export const dynamic = "force-dynamic";

// Simplified TOK/EE bonus matrix
function corePoints(tok?: string | null, ee?: string | null): number {
  if (!tok || !ee) return 0;
  const m: Record<string, number> = {
    "A A": 3, "A B": 3, "B A": 3, "A C": 2, "C A": 2, "A D": 2, "D A": 2,
    "B B": 2, "B C": 1, "C B": 1, "B D": 1, "D B": 1, "C C": 1,
  };
  return m[`${tok} ${ee}`] ?? 0;
}

export default async function ProgrammesPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const [students, subjectRecords, coreRecords, examSessions] = await Promise.all([
    prisma.student.findMany({ where: { isActive: true }, select: { id: true, curriculum: true } }),
    prisma.iBSubjectRecord.findMany(),
    prisma.iBCoreRecord.findMany(),
    prisma.iBExamSession.findMany({ orderBy: { date: "asc" } }),
  ]);

  const counts = { PYP: 0, MYP: 0, DP: 0, OTHER: 0 };
  for (const s of students) {
    if (s.curriculum in counts) counts[s.curriculum as keyof typeof counts]++;
    else counts.OTHER++;
  }

  // ── DP aggregates ──
  const dpByStudent = new Map<string, { grades: number[]; predicted: number[] }>();
  const groupSums: Record<number, { sum: number; n: number }> = {};
  for (const r of subjectRecords.filter((r) => r.level === "HL" || r.level === "SL")) {
    const e = dpByStudent.get(r.studentId) || { grades: [], predicted: [] };
    if (r.currentGrade) e.grades.push(r.currentGrade);
    if (r.predictedGrade) e.predicted.push(r.predictedGrade);
    dpByStudent.set(r.studentId, e);
    if (r.currentGrade) {
      const g = (groupSums[r.subjectGroup] = groupSums[r.subjectGroup] || { sum: 0, n: 0 });
      g.sum += r.currentGrade;
      g.n++;
    }
  }
  const tokByStudent = new Map(coreRecords.filter((c) => c.element === "TOK").map((c) => [c.studentId, c]));
  const eeByStudent = new Map(coreRecords.filter((c) => c.element === "EE").map((c) => [c.studentId, c]));

  const dpTotals: number[] = [];
  let below24 = 0;
  for (const [sid, e] of dpByStudent) {
    if (e.grades.length === 0) continue;
    const total = e.grades.reduce((a, b) => a + b, 0) + corePoints(tokByStudent.get(sid)?.grade, eeByStudent.get(sid)?.grade);
    dpTotals.push(total);
    if (total < 24) below24++;
  }
  const dpAvg = dpTotals.length ? dpTotals.reduce((a, b) => a + b, 0) / dpTotals.length : 0;

  const eeStatuses = { SUBMITTED: 0, IN_PROGRESS: 0, OTHER: 0 };
  for (const c of eeByStudent.values()) {
    if (c.status === "SUBMITTED" || c.status === "COMPLETE") eeStatuses.SUBMITTED++;
    else if (c.status === "IN_PROGRESS") eeStatuses.IN_PROGRESS++;
    else eeStatuses.OTHER++;
  }

  const casRecords = coreRecords.filter((c) => c.element === "CAS");
  const casOnTrack = casRecords.filter(
    (c) => c.creativityHours > 0 && c.activityHours > 0 && c.serviceHours > 0 && c.creativityHours + c.activityHours + c.serviceHours >= 60
  ).length;

  // ── MYP aggregates ──
  const mypRecords = subjectRecords.filter((r) => r.level === "MYP");
  const critAvgs = ["critA", "critB", "critC", "critD"].map((k) => {
    const vals = mypRecords.map((r) => r[k as "critA"]).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  const mypGrades = mypRecords.map((r) => r.currentGrade).filter((g): g is number => g !== null);
  const mypAvg = mypGrades.length ? mypGrades.reduce((a, b) => a + b, 0) / mypGrades.length : 0;
  const mypSubjectAvgs = Object.entries(
    mypRecords.reduce<Record<string, { sum: number; n: number }>>((acc, r) => {
      if (r.currentGrade) {
        const e = (acc[r.subjectName] = acc[r.subjectName] || { sum: 0, n: 0 });
        e.sum += r.currentGrade;
        e.n++;
      }
      return acc;
    }, {})
  ).map(([name, { sum, n }]) => ({ name, avg: sum / n }));

  const data = {
    counts,
    dp: {
      cohort: counts.DP,
      avgPoints: Math.round(dpAvg * 10) / 10,
      below24,
      graded: dpTotals.length,
      groupAvgs: Object.entries(groupSums).map(([g, { sum, n }]) => ({ group: Number(g), avg: Math.round((sum / n) * 10) / 10 })),
      ee: eeStatuses,
      casOnTrack,
      casTotal: casRecords.length,
      upcoming: examSessions
        .filter((e) => e.programme === "DP")
        .slice(0, 5)
        .map((e) => ({ session: e.session, subject: e.subjectName, paper: e.paper, date: e.date.toISOString() })),
    },
    myp: {
      cohort: counts.MYP,
      avgGrade: Math.round(mypAvg * 10) / 10,
      critAvgs: critAvgs.map((v) => Math.round(v * 10) / 10),
      subjectAvgs: mypSubjectAvgs.sort((a, b) => b.avg - a.avg),
      upcoming: examSessions
        .filter((e) => e.programme === "MYP")
        .slice(0, 5)
        .map((e) => ({ session: e.session, subject: e.subjectName, paper: e.paper, date: e.date.toISOString() })),
    },
    pyp: { cohort: counts.PYP },
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="IB Programme Coordination"
        description="PYP, MYP and DP coordinator dashboards — cohort health, assessment progress and core requirements at a glance."
      />
      <ProgrammesClient data={data} />
    </div>
  );
}
