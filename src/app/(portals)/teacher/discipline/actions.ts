"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { findCategory } from "@/lib/behavior";

/**
 * Log a merit or demerit against one of your own students, and tell the parent.
 *
 * The form this replaces had `onSubmit={e => e.preventDefault()}`. The student
 * field was a free-text box seeded with a name and resolved to nothing; the
 * category select was never read; the notes textarea claimed it would be
 * "analyzed by our ML Sentiment Engine". Pressing "Submit Log & Alert Parent"
 * did nothing at all — no write, no message, not even a confirmation.
 */
export async function logTeacherIncident(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, classes: { select: { id: true } } },
  });
  if (!teacher) return { error: "Your staff record is missing. Ask an administrator to check your profile." };

  const studentId = String(formData.get("studentId") ?? "");
  const categoryValue = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const notifyParent = formData.get("notifyParent") === "on";

  const category = findCategory(categoryValue);
  if (!studentId) return { error: "Choose a student." };
  if (!category) return { error: "Choose a behaviour category." };
  if (!description) return { error: "Describe what happened — this is what the student's parents will read." };

  const classIds = teacher.classes.map((c) => c.id);
  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId: { in: classIds } },
    select: { id: true, name: true, parent: { select: { userId: true } } },
  });
  if (!student) return { error: "That student is not in one of your classes." };

  const signed = category.type === "DEMERIT" ? -category.points : category.points;

  await prisma.behaviorIncident.create({
    data: {
      studentId: student.id,
      teacherId: teacher.id,
      type: category.type,
      category: category.value,
      description,
      points: signed,
      date: new Date(),
    },
  });

  // "Alert Parent" was in the button label from the start. This is the first
  // version where pressing it reaches anyone.
  let told = false;
  if (notifyParent && student.parent?.userId) {
    await prisma.notification.create({
      data: {
        userId: student.parent.userId,
        title: category.type === "MERIT" ? `${student.name} earned a merit` : `${student.name} received a demerit`,
        message: `${category.label} — ${description}`,
        type: category.type === "MERIT" ? "SUCCESS" : "ALERT",
      },
    });
    told = true;
  }

  revalidatePath("/teacher/discipline");
  revalidatePath("/admin/behavior");
  revalidatePath("/parent/discipline");

  return {
    success:
      `Logged ${category.type === "MERIT" ? "+" : "−"}${category.points} for ${student.name}` +
      (notifyParent ? (told ? " and sent to their parent." : " — no parent account is linked, so nobody was notified.") : "."),
  };
}
