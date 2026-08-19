"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/ui/form";

/**
 * Assignment CRUD.
 *
 * Every action re-resolves the teacher from the session and checks that the
 * assignment (or the class it targets) actually belongs to them — a teacher
 * must not be able to edit, grade or delete another teacher's coursework by
 * passing a different id, and these are directly invocable endpoints.
 */

async function currentTeacher() {
  const session = await getSession();
  if (!session?.user) return null;
  if (!["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) return null;
  return prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: { select: { id: true } } },
  });
}

/** Due dates are end-of-day in IST, which is what "due on the 5th" means here. */
function endOfDayIST(yyyyMmDd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
  const d = new Date(`${yyyyMmDd}T23:59:59.000+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Fields = { title: string; description: string; subjectId: string; classroomId: string; dueDate: Date };

function readFields(formData: FormData): { ok: true; data: Fields } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const classroomId = String(formData.get("classroomId") ?? "").trim();
  const due = String(formData.get("dueDate") ?? "").trim();

  if (!title) return { ok: false, error: "Give the assignment a title." };
  if (title.length > 120) return { ok: false, error: "Title is too long (120 characters maximum)." };
  if (!description) return { ok: false, error: "Add a description so students know what to do." };
  if (description.length > 4000) return { ok: false, error: "Description is too long (4000 characters maximum)." };
  if (!subjectId) return { ok: false, error: "Choose a subject." };
  if (!classroomId) return { ok: false, error: "Choose a class." };

  const dueDate = endOfDayIST(due);
  if (!dueDate) return { ok: false, error: "Choose a valid due date." };

  return { ok: true, data: { title, description, subjectId, classroomId, dueDate } };
}

export async function createAssignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacher = await currentTeacher();
  if (!teacher) return { error: "You do not have permission to do that." };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  if (!teacher.classes.some((c) => c.id === parsed.data.classroomId)) {
    return { error: "You can only set work for your own classes." };
  }

  try {
    await prisma.homework.create({ data: { ...parsed.data, teacherId: teacher.id } });
  } catch (e) {
    console.error("[createAssignment]", e);
    return { error: "Could not save the assignment. Please try again." };
  }

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/homework");
  return { success: `"${parsed.data.title}" created.` };
}

export async function updateAssignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacher = await currentTeacher();
  if (!teacher) return { error: "You do not have permission to do that." };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.homework.findUnique({ where: { id }, select: { teacherId: true } });
  if (!existing) return { error: "That assignment no longer exists." };
  if (existing.teacherId !== teacher.id) return { error: "You can only edit your own assignments." };

  const parsed = readFields(formData);
  if (!parsed.ok) return { error: parsed.error };
  if (!teacher.classes.some((c) => c.id === parsed.data.classroomId)) {
    return { error: "You can only set work for your own classes." };
  }

  try {
    await prisma.homework.update({ where: { id }, data: parsed.data });
  } catch (e) {
    console.error("[updateAssignment]", e);
    return { error: "Could not save your changes. Please try again." };
  }

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/homework");
  return { success: "Changes saved." };
}

export async function deleteAssignment(id: string): Promise<{ error?: string; success?: boolean }> {
  const teacher = await currentTeacher();
  if (!teacher) return { error: "You do not have permission to do that." };

  const existing = await prisma.homework.findUnique({
    where: { id },
    select: { teacherId: true, _count: { select: { submissions: true } } },
  });
  if (!existing) return { error: "That assignment no longer exists." };
  if (existing.teacherId !== teacher.id) return { error: "You can only delete your own assignments." };

  try {
    // Submissions cascade, so say so plainly rather than destroying work silently.
    await prisma.homework.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteAssignment]", e);
    return { error: "Could not delete the assignment. Please try again." };
  }

  revalidatePath("/teacher/assignments");
  revalidatePath("/student/homework");
  return { success: true };
}

export async function gradeSubmission(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacher = await currentTeacher();
  if (!teacher) return { error: "You do not have permission to do that." };

  const submissionId = String(formData.get("submissionId") ?? "");
  const raw = String(formData.get("grade") ?? "").trim();

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id: submissionId },
    select: { homework: { select: { teacherId: true, id: true } } },
  });
  if (!submission) return { error: "That submission no longer exists." };
  if (submission.homework.teacherId !== teacher.id) {
    return { error: "You can only grade your own assignments." };
  }

  if (raw === "") {
    await prisma.homeworkSubmission.update({ where: { id: submissionId }, data: { grade: null } });
    revalidatePath(`/teacher/assignments/${submission.homework.id}`);
    return { success: "Grade cleared." };
  }

  const grade = Number(raw);
  // IB scale, never percentages.
  if (!Number.isFinite(grade) || grade < 1 || grade > 7) {
    return { error: "Grade must be on the IB scale, 1 to 7." };
  }

  try {
    await prisma.homeworkSubmission.update({ where: { id: submissionId }, data: { grade } });
  } catch (e) {
    console.error("[gradeSubmission]", e);
    return { error: "Could not save the grade. Please try again." };
  }

  revalidatePath(`/teacher/assignments/${submission.homework.id}`);
  revalidatePath("/student/homework");
  return { success: "Grade saved." };
}
