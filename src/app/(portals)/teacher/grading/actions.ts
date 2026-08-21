"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

async function ctx() {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, subjects: true, classes: { select: { id: true, name: true } } },
  });
  if (!teacher) return null;
  return { auth, teacher };
}

/**
 * Save a whole column of the gradebook.
 *
 * The screen this replaces was hardcoded JSX: three invented students with
 * `defaultValue` scores, "Total %" and "IB Grade" as fixed text that never
 * recomputed, and a "Save Scores" button whose handler set `saved = true`,
 * flipped the label to "✓ Saved" and reset it three seconds later. There was
 * no network call of any kind, and no student ids on the page to make one with.
 *
 * Grades are keyed on (student, title, term) so re-saving corrects the existing
 * result rather than stacking up duplicates for the same assessment.
 */
export async function saveGradebook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: "Your staff record is missing. Ask an administrator to check your profile." };

  const classroomId = String(formData.get("classroomId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const term = String(formData.get("term") ?? "").trim();
  const type = String(formData.get("type") ?? "FORMATIVE");
  const subjectName = String(formData.get("subjectName") ?? "").trim();

  if (!c.teacher.classes.some((k) => k.id === classroomId)) return { error: "That is not one of your classes." };
  if (!title) return { error: "Name the assessment — it is how the grade is identified later." };
  if (!term) return { error: "Choose a term." };
  if (!subjectName) return { error: "Choose a subject." };
  if (!["FORMATIVE", "SUMMATIVE", "MOCK", "IA_DRAFT", "ORAL"].includes(type)) return { error: "Choose an assessment type." };

  const students = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true },
  });
  const allowed = new Set(students.map((s) => s.id));

  type Entry = { studentId: string; grade: number | null; comment: string | null };
  const entries: Entry[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("grade-")) continue;
    const studentId = key.slice("grade-".length);
    if (!allowed.has(studentId)) continue;

    const raw = String(value).trim();
    const comment = String(formData.get(`comment-${studentId}`) ?? "").trim();

    if (!raw) {
      // Blank means "not graded yet", which is different from zero.
      entries.push({ studentId, grade: null, comment: comment || null });
      continue;
    }
    const grade = Number(raw);
    if (!Number.isInteger(grade) || grade < 1 || grade > 7) {
      return { error: `IB grades run 1 to 7 — "${raw}" is not one.` };
    }
    entries.push({ studentId, grade, comment: comment || null });
  }

  const toWrite = entries.filter((e) => e.grade !== null);
  if (!toWrite.length) return { error: "Nothing to save — enter at least one grade." };

  const existing = await prisma.assessmentResult.findMany({
    where: { studentId: { in: toWrite.map((e) => e.studentId) }, title, term },
    select: { id: true, studentId: true },
  });
  const byStudent = new Map(existing.map((e) => [e.studentId, e.id]));

  const date = new Date();
  await prisma.$transaction(
    toWrite.map((e) => {
      const id = byStudent.get(e.studentId);
      return id
        ? prisma.assessmentResult.update({
            where: { id },
            data: { grade: e.grade!, comment: e.comment, subjectName, type, date },
          })
        : prisma.assessmentResult.create({
            data: {
              studentId: e.studentId, subjectName, title, type, date,
              grade: e.grade!, maxGrade: 7, comment: e.comment, term,
            },
          });
    }),
  );

  revalidatePath("/teacher/grading");
  revalidatePath("/teacher/reports");
  revalidatePath("/student/grades");

  const updated = toWrite.filter((e) => byStudent.has(e.studentId)).length;
  const created = toWrite.length - updated;
  return {
    success:
      `Saved ${toWrite.length} grade${toWrite.length === 1 ? "" : "s"}` +
      (updated ? ` (${created} new, ${updated} updated).` : "."),
  };
}

/**
 * Publish an assessment to families.
 *
 * The button was captioned "This will notify parents and students" and had no
 * onClick at all. It now sends each student and each linked parent a
 * notification naming the assessment and the grade.
 */
export async function publishResults(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const c = await ctx();
  if (!c) return { error: "Your staff record is missing." };

  const classroomId = String(formData.get("classroomId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const term = String(formData.get("term") ?? "").trim();

  if (!c.teacher.classes.some((k) => k.id === classroomId)) return { error: "That is not one of your classes." };
  if (!title || !term) return { error: "Choose an assessment first." };

  const students = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true, name: true, userId: true, parent: { select: { userId: true } } },
  });

  const results = await prisma.assessmentResult.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, title, term },
    select: { studentId: true, grade: true, maxGrade: true, comment: true },
  });
  if (!results.length) return { error: "Nothing to publish — no grades are saved for that assessment yet." };

  const byStudent = new Map(results.map((r) => [r.studentId, r]));
  const rows: { userId: string; title: string; message: string; type: string }[] = [];

  for (const s of students) {
    const r = byStudent.get(s.id);
    if (!r) continue;
    const message = `${title} (${term}): ${r.grade}/${r.maxGrade}.${r.comment ? ` ${r.comment}` : ""}`;
    if (s.userId) rows.push({ userId: s.userId, title: "New grade published", message, type: "INFO" });
    if (s.parent?.userId) {
      rows.push({ userId: s.parent.userId, title: `${s.name}: new grade published`, message, type: "INFO" });
    }
  }

  if (!rows.length) return { error: "Grades are saved, but nobody has a portal account to notify." };

  await prisma.notification.createMany({ data: rows });
  revalidatePath("/teacher/grading");

  return { success: `Published — ${rows.length} notification${rows.length === 1 ? "" : "s"} sent.` };
}
