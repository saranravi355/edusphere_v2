import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IB_TERMS, subjectsFor, type Programme } from "@/lib/ib/subjects";
import IbRecordsEditor, { type IbRow } from "./IbRecordsEditor";

/**
 * IB Subject Records.
 *
 * The grade an IB school is judged on lives in IBSubjectRecord: the current
 * grade, the predicted grade a university offer hangs off, and the four MYP
 * criteria. The application displayed those numbers in five places — the
 * student profile, the programmes dashboards, Analytics, the report card, the
 * parent gradebook — and could not write a single one of them. They were there
 * because the seed script had put them there.
 *
 * This is the screen that writes them. One class, one subject, one term at a
 * time, in the same shape as the assessment gradebook next door, because it is
 * the same job done with a different scale.
 */

export const dynamic = "force-dynamic";

export default async function TeacherIbRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; subject?: string; term?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { classes: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <PageHeader title="IB Subject Records" description="Current grades, predicted grades and MYP criteria." />
        <p className="text-slate-500">You are not assigned to any classes yet.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const activeClass = teacher.classes.find((c) => c.id === sp.classId) ?? teacher.classes[0];
  const term = (IB_TERMS as readonly string[]).includes(sp.term ?? "") ? sp.term! : IB_TERMS[0];

  const students = await prisma.student.findMany({
    where: { classroomId: activeClass.id, isActive: true },
    select: { id: true, name: true, registrationNo: true, curriculum: true },
    orderBy: { name: "asc" },
  });

  /**
   * Which subject list to offer.
   *
   * A class is normally one programme, so the picker follows whichever
   * programme most of the roll is in rather than listing DP and MYP subjects
   * together — twenty options where eight are meant.
   */
  const mypCount = students.filter((s) => s.curriculum === "MYP").length;
  const programme: Programme = mypCount >= students.length - mypCount ? "MYP" : "DP";
  const catalogue = subjectsFor(programme);

  // Subjects this class already has records in come first: they are the ones a
  // teacher is most likely to be reopening.
  const inUse = students.length
    ? (
        await prisma.iBSubjectRecord.findMany({
          where: { studentId: { in: students.map((s) => s.id) } },
          distinct: ["subjectName"],
          select: { subjectName: true },
          orderBy: { subjectName: "asc" },
        })
      ).map((r) => r.subjectName)
    : [];

  const options = [...new Set([...inUse, ...catalogue.map((s) => s.name)])];
  const subjectName = options.includes(sp.subject ?? "") ? sp.subject! : options[0] ?? "";

  const records = subjectName && students.length
    ? await prisma.iBSubjectRecord.findMany({
        where: { studentId: { in: students.map((s) => s.id) }, subjectName, term },
        select: {
          studentId: true, currentGrade: true, predictedGrade: true, level: true,
          critA: true, critB: true, critC: true, critD: true, teacherComment: true,
        },
      })
    : [];
  const byStudent = new Map(records.map((r) => [r.studentId, r]));

  const rows: IbRow[] = students.map((s) => {
    const r = byStudent.get(s.id);
    return {
      id: s.id,
      name: s.name,
      registrationNo: s.registrationNo,
      curriculum: s.curriculum,
      hasRecord: Boolean(r),
      level: r?.level ?? null,
      currentGrade: r?.currentGrade ?? null,
      predictedGrade: r?.predictedGrade ?? null,
      critA: r?.critA ?? null,
      critB: r?.critB ?? null,
      critC: r?.critC ?? null,
      critD: r?.critD ?? null,
      comment: r?.teacherComment ?? "",
    };
  });

  const select =
    "p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium " +
    "text-slate-700 dark:text-slate-300 text-sm";

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <Link
        href="/teacher/grading"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden /> Back to Grading
      </Link>

      <PageHeader
        title="IB Subject Records"
        description="Current grade, predicted grade and MYP criteria — the record the profile, report card and predicted-grade analysis all read from."
      />

      <form className="flex flex-col md:flex-row md:items-end gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ib-class">Class</label>
            <select id="ib-class" name="classId" defaultValue={activeClass.id} className={select}>
              {teacher.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[16rem]">
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ib-subject">Subject</label>
            <select id="ib-subject" name="subject" defaultValue={subjectName} className={`${select} w-full`}>
              {options.map((s) => (
                <option key={s} value={s}>
                  {s}{inUse.includes(s) ? "" : " — not yet recorded"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ib-term">Term</label>
            <select id="ib-term" name="term" defaultValue={term} className={select}>
              {IB_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg transition-colors text-sm"
        >
          Open
        </button>
      </form>

      {subjectName && rows.length > 0 ? (
        <IbRecordsEditor
          classroomId={activeClass.id}
          className={activeClass.name}
          subjectName={subjectName}
          term={term}
          programme={programme}
          rows={rows}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {rows.length === 0
              ? `${activeClass.name} has no active students.`
              : "Choose a subject above to start."}
          </p>
        </div>
      )}
    </div>
  );
}
