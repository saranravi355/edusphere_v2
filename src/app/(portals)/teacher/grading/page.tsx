import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import Gradebook from "./Gradebook";

export const dynamic = "force-dynamic";

const TERMS = ["Term 1 2026-27", "Term 2 2026-27", "Term 3 2026-27"];
const TYPES = [
  { value: "FORMATIVE", label: "Formative" },
  { value: "SUMMATIVE", label: "Summative" },
  { value: "MOCK", label: "Mock" },
  { value: "IA_DRAFT", label: "IA draft" },
  { value: "ORAL", label: "Oral" },
];

/**
 * Grading Engine.
 *
 * The whole gradebook was hardcoded JSX — three invented students, fixed
 * "Total %" and "IB Grade" text that never recomputed, a class filter and a
 * term filter with no handlers, a student search box with no handler, and a
 * "Save Scores" button that flipped its own label to "✓ Saved" for three
 * seconds and made no network call. There were no student ids on the page to
 * make one with. The Class Performance panel was three fixed strings, and
 * "Publish Report Cards" — captioned "This will notify parents and students" —
 * had no onClick.
 *
 * Grades are written to AssessmentResult, keyed on (student, title, term) so a
 * correction updates the existing row. Raw marks out of 20/80 are not modelled
 * anywhere in the schema, so this grades on the IB 1–7 scale the rest of the
 * app uses rather than implying a weighting that does not exist.
 */
export default async function TeacherGradingEngine({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; title?: string; term?: string; type?: string; subject?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { subjects: true, classes: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <PageHeader title="Grading Engine" description="Enter grades and publish them to families." />
        <p className="text-slate-500">You are not assigned to any classes yet.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const activeClass = teacher.classes.find((c) => c.id === sp.classId) ?? teacher.classes[0];
  const term = TERMS.includes(sp.term ?? "") ? sp.term! : TERMS[0];
  const type = TYPES.some((t) => t.value === sp.type) ? sp.type! : "SUMMATIVE";

  const mySubjects = teacher.subjects.split(",").map((s) => s.trim()).filter(Boolean);
  const subjectName = mySubjects.includes(sp.subject ?? "") ? sp.subject! : mySubjects[0] ?? "General";

  const students = await prisma.student.findMany({
    where: { classroomId: activeClass.id, isActive: true },
    select: { id: true, name: true, registrationNo: true },
    orderBy: { name: "asc" },
  });

  // Assessments already recorded for this class and term, so a teacher can come
  // back to one and correct it instead of creating a near-duplicate.
  const existingTitles = students.length
    ? (
        await prisma.assessmentResult.findMany({
          where: { studentId: { in: students.map((s) => s.id) }, term },
          distinct: ["title"],
          select: { title: true },
          orderBy: { title: "asc" },
        })
      ).map((r) => r.title)
    : [];

  const title = (sp.title ?? "").trim() || existingTitles[0] || "";

  const saved = title && students.length
    ? await prisma.assessmentResult.findMany({
        where: { studentId: { in: students.map((s) => s.id) }, title, term },
        select: { studentId: true, grade: true, comment: true },
      })
    : [];
  const savedBy = new Map(saved.map((r) => [r.studentId, r]));

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    registrationNo: s.registrationNo,
    grade: savedBy.get(s.id)?.grade ?? null,
    comment: savedBy.get(s.id)?.comment ?? "",
  }));

  const select =
    "p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium " +
    "text-slate-700 dark:text-slate-300 text-sm";

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Grading Engine"
        description="Enter IB grades and comments, then publish them to families."
      />

      {/*
        The class and term dropdowns had no handlers and the gradebook under
        them was fixed markup, so neither could have done anything. They are a
        GET form now, which means a particular assessment is a shareable URL.
      */}
      <form className="flex flex-col md:flex-row md:items-end gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="gb-class">Class</label>
            <select id="gb-class" name="classId" defaultValue={activeClass.id} className={select}>
              {teacher.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="gb-subject">Subject</label>
            <select id="gb-subject" name="subject" defaultValue={subjectName} className={select}>
              {(mySubjects.length ? mySubjects : ["General"]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="gb-term">Term</label>
            <select id="gb-term" name="term" defaultValue={term} className={select}>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="gb-type">Type</label>
            <select id="gb-type" name="type" defaultValue={type} className={select}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[14rem]">
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="gb-title">Assessment</label>
            <input
              id="gb-title"
              name="title"
              list="gb-titles"
              defaultValue={title}
              placeholder="e.g. Unit Test 2: Mechanics"
              className={`${select} w-full`}
            />
            <datalist id="gb-titles">
              {existingTitles.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg transition-colors text-sm">
            Open
          </button>
          <Link
            href="/teacher/grading/ai-grader"
            className="px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <FileText size={16} aria-hidden /> AI Exam Grader
          </Link>
        </div>
      </form>

      {title ? (
        <Gradebook
          classroomId={activeClass.id}
          title={title}
          term={term}
          type={type}
          subjectName={subjectName}
          rows={rows}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Name an assessment above and press Open to start grading {activeClass.name}.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Nothing has been graded for {term} yet, so there is nothing to reopen.
          </p>
        </div>
      )}
    </div>
  );
}
