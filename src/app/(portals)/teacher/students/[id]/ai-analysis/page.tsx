import PageHeader from "@/components/ui/PageHeader";
import AIPreviewNotice from "@/components/ai/AIPreviewNotice";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { classroomIdsForTeacher } from "@/lib/teacherScope";
import { firstName } from "@/lib/utils";
import { ArrowLeft, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import AIAnalysisView, { type MonthPoint, type SubjectPoint } from "./AIAnalysisView";

export const dynamic = "force-dynamic";

/**
 * AI analysis for one student — still a preview, but about the right child.
 *
 * This page used to be a client component that ignored the student entirely. It
 * printed "Aarav Patel" and "Mathematics" whatever id was in the address, and
 * drew both charts from a hash of that id on a 0–100 percentage axis, under an
 * "AI Confidence: 94%" badge. Every teacher who pressed AI Insights on any
 * profile was told that Aarav's calculus was improving.
 *
 * The AI model is still not wired — that stays a mock-up until the school says
 * otherwise. What changed is underneath it: the name, the subjects and both
 * charts come from this student's own record on the IB 1–7 scale, and the
 * written summary is produced from those figures by plain rules that the page
 * states, rather than being presented as a model's reading of the child.
 *
 * Scoped like the profile it is reached from: a teacher sees students in their
 * own classrooms, a Principal sees the school.
 */

/** Short chart labels for the subject names long enough to crowd an axis. */
const SHORT: Record<string, string> = {
  "Mathematics: Analysis & Approaches": "Maths AA",
  "Mathematics: Applications & Interpretation": "Maths AI",
  "English A: Language & Literature": "English A L&L",
  "English A: Literature": "English A Lit",
  "Language Acquisition: Spanish": "Spanish",
  "Individuals & Societies": "I&S",
  "Physical & Health Education": "PHE",
  "Language & Literature": "Lang & Lit",
  "Business Management": "Business",
};

function subjectLabel(subjectName: string, level: string | null): string {
  const name = SHORT[subjectName] ?? subjectName;
  return level === "HL" || level === "SL" ? `${name} ${level}` : name;
}

const one = (n: number) => n.toFixed(1);

export default async function AIAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      curriculum: true,
      classroom: { select: { id: true, name: true } },
      ibSubjects: {
        select: { subjectName: true, level: true, currentGrade: true, predictedGrade: true },
        orderBy: [{ subjectGroup: "asc" }, { subjectName: "asc" }],
      },
      // Only results that have happened. The seeded record runs to the end of
      // the academic year, so without this the trend line ran through months
      // whose grades nobody has been given yet.
      assessmentResults: {
        where: { date: { lte: new Date() } },
        select: { date: true, grade: true, maxGrade: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!student) notFound();

  // Checked after loading so an id outside the teacher's classes 404s exactly
  // as a made-up one does, rather than confirming the child exists.
  if (session.user.role !== "PRINCIPAL") {
    const allowed = await classroomIdsForTeacher(session.user.id);
    if (!student.classroom || !allowed.includes(student.classroom.id)) notFound();
  }

  // ── Monthly average of dated assessment results, on the 1–7 scale ─────────
  const byMonth = new Map<string, { sum: number; n: number; label: string }>();
  for (const a of student.assessmentResults) {
    const scaled = a.maxGrade > 0 ? (a.grade / a.maxGrade) * 7 : a.grade;
    const key = a.date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" });
    const entry = byMonth.get(key) ?? {
      sum: 0,
      n: 0,
      label: a.date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", month: "short", year: "2-digit" }),
    };
    entry.sum += scaled;
    entry.n += 1;
    byMonth.set(key, entry);
  }
  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, m]) => ({ month: m.label, grade: Math.round((m.sum / m.n) * 10) / 10, n: m.n }));
  const months: MonthPoint[] = monthly.map(({ month, grade }) => ({ month, grade }));

  const subjects: SubjectPoint[] = student.ibSubjects.map((s) => ({
    subject: subjectLabel(s.subjectName, s.level),
    current: s.currentGrade,
    predicted: s.predictedGrade,
  }));

  // ── The summary: rules over the record, stated as such ─────────────────────
  const graded = student.ibSubjects
    .filter((s) => s.currentGrade !== null)
    .map((s) => ({ name: subjectLabel(s.subjectName, s.level), current: s.currentGrade as number, predicted: s.predictedGrade }));

  const strongest = graded.length ? graded.reduce((best, s) => (s.current > best.current ? s : best)) : null;
  const weakest = graded.length ? graded.reduce((low, s) => (s.current < low.current ? s : low)) : null;
  const aheadCount = graded.filter((s) => s.predicted !== null && s.predicted > s.current).length;
  const belowCurrent = graded.filter((s) => s.predicted !== null && s.predicted < s.current);

  // A trend needs months with more than one result in them: a single quiz is not
  // a direction. Early in a term a record can hold six results for one month and
  // one for the next, and reading that lone result as "falling" would suggest a
  // wellbeing check-in on the strength of a single mark. Such months still
  // appear on the chart; they just do not set the headline.
  const trendMonths = monthly.filter((m) => m.n >= 2);
  let trend: "rising" | "falling" | "steady" | null = null;
  if (trendMonths.length >= 2) {
    const delta = trendMonths[trendMonths.length - 1].grade - trendMonths[0].grade;
    trend = delta >= 0.3 ? "rising" : delta <= -0.3 ? "falling" : "steady";
  }

  const name = firstName(student.name, "This student");
  const first = trendMonths[0];
  const last = trendMonths[trendMonths.length - 1];

  const headline =
    trend && first && last
      ? `${name}'s assessment grades are ${trend} — ${one(first.grade)} in ${first.month}, ${one(last.grade)} in ${last.month}.`
      : graded.length
        ? `${name} has ${graded.length} graded IB subject${graded.length === 1 ? "" : "s"} this term.`
        : `There is not enough on ${name}'s record yet for a summary.`;

  const findings: string[] = [];
  if (strongest) findings.push(`Strongest subject: ${strongest.name}, at ${strongest.current}.`);
  if (weakest && weakest !== strongest) {
    findings.push(
      `Most room to grow: ${weakest.name}, at ${weakest.current}${weakest.predicted !== null ? `, predicted ${weakest.predicted}` : ""}.`,
    );
  }
  if (aheadCount) findings.push(`Predicted above the current grade in ${aheadCount} subject${aheadCount === 1 ? "" : "s"}.`);

  const steps: string[] = [];
  if (weakest && weakest !== strongest) steps.push(`Plan a short one-to-one on ${weakest.name} before the next assessment.`);
  if (trend === "falling") steps.push("Check in on workload and wellbeing — grades have dipped across recent months.");
  if (belowCurrent.length) {
    steps.push(`Review the predicted grade in ${belowCurrent.map((s) => s.name).join(", ")}: it sits below the current grade.`);
  }
  if (!steps.length && graded.length) steps.push("Nothing in the record calls for an intervention; keep the current approach.");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Link
        href={`/teacher/students/${student.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden /> Back to profile
      </Link>

      <PageHeader
        title="AI Performance Analysis"
        description={`${student.name} · ${student.classroom?.name ?? "Unassigned"} · ${student.curriculum}`}
      />

      <AIPreviewNotice>
        The charts show {name}&rsquo;s real record — IB subject grades and dated assessment results, on the 1–7
        scale. The summary and next steps are produced from those figures by simple rules, not by an AI model, and
        nothing here is saved.
      </AIPreviewNotice>

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={150} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-indigo-300" />
            <span className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Summary from the record</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3 max-w-2xl">{headline}</h2>
          {findings.length > 0 && (
            <ul className="text-indigo-200 text-sm max-w-xl leading-relaxed space-y-1">
              {findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AIAnalysisView subjects={subjects} months={months} />

      {steps.length > 0 && (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-blue-500" /> Suggested next steps
          </h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed list-disc pl-5 space-y-1">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
