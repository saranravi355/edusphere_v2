"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

const STUDENT_ROLES = ["STUDENT"] as const;

function ratingFrom(formData: FormData, field: string): number | null {
  const raw = formData.get(field);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

/**
 * Submit (or update) this student's feedback for one teacher.
 *
 * Upserted on the (studentId, teacherId) unique pair rather than appended, so
 * re-rating a teacher replaces the earlier answer instead of leaving the
 * teacher with two conflicting rows to average against each other.
 */
export async function submitTeacherFeedback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const student = await prisma.student.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, classroomId: true },
  });
  if (!student) return { error: "Your student record is missing. Ask an administrator to check your profile." };

  const teacherId = String(formData.get("teacherId") ?? "").trim();
  if (!teacherId) return { error: "Choose a teacher." };

  // Only a teacher who actually teaches this student's class is a valid
  // target — otherwise the teacherId is just whatever a POST body claims.
  const eligible = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      OR: [
        { classes: { some: { id: student.classroomId ?? "__none__" } } },
        { timetable: { some: { classroomId: student.classroomId ?? "__none__" } } },
      ],
    },
    select: { id: true },
  });
  if (!eligible) return { error: "That teacher does not teach your class." };

  const classConductRating = ratingFrom(formData, "classConductRating");
  const explanationRating = ratingFrom(formData, "explanationRating");
  const communicationRating = ratingFrom(formData, "communicationRating");
  const supportRating = ratingFrom(formData, "supportRating");
  if (!classConductRating || !explanationRating || !communicationRating || !supportRating) {
    return { error: "Give a star rating (1–5) on all four questions." };
  }

  const comment = String(formData.get("comment") ?? "").trim().slice(0, 2000) || null;

  await prisma.teacherFeedback.upsert({
    where: { studentId_teacherId: { studentId: student.id, teacherId } },
    create: {
      studentId: student.id,
      teacherId,
      classConductRating,
      explanationRating,
      communicationRating,
      supportRating,
      comment,
    },
    update: {
      classConductRating,
      explanationRating,
      communicationRating,
      supportRating,
      comment,
    },
  });

  revalidatePath("/student/teacher-feedback");
  revalidatePath("/teacher/feedback");

  return { success: "Feedback sent to your teacher. Thank you." };
}
