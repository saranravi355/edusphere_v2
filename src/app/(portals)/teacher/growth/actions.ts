"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { LEARNER_PROFILE_ATTRIBUTES, ATL_CATEGORIES } from "@/lib/ib";

async function assertTeaches(teacherUserId: string, studentId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    select: { id: true, classes: { select: { id: true } }, timetable: { select: { classroomId: true } } },
  });
  if (!teacher) return { error: "Your staff record is missing." } as const;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classroomId: true } });
  if (!student) return { error: "That student no longer exists." } as const;

  const classroomIds = new Set([...teacher.classes.map((c) => c.id), ...teacher.timetable.map((t) => t.classroomId)]);
  if (!student.classroomId || !classroomIds.has(student.classroomId)) return { error: "You do not teach this student." } as const;

  return { teacherId: teacher.id } as const;
}

export async function addLearnerProfileEvidence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const check = await assertTeaches(auth.user.id, studentId);
  if ("error" in check) return { error: check.error };

  const attribute = String(formData.get("attribute") ?? "");
  if (!LEARNER_PROFILE_ATTRIBUTES.some((a) => a.value === attribute)) return { error: "Choose a Learner Profile attribute." };

  const evidence = String(formData.get("evidence") ?? "").trim();
  if (!evidence) return { error: "Describe what you observed." };

  await prisma.learnerProfileEvidence.create({
    data: { studentId, attribute, evidence, recordedById: check.teacherId },
  });

  revalidatePath(`/teacher/growth`);
  revalidatePath(`/student/growth`);
  return { success: "Evidence recorded." };
}

export async function addATLRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const check = await assertTeaches(auth.user.id, studentId);
  if ("error" in check) return { error: check.error };

  const category = String(formData.get("category") ?? "");
  if (!ATL_CATEGORIES.some((c) => c.value === category)) return { error: "Choose an ATL skill category." };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 4) return { error: "Choose a rating." };

  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.aTLSkillRecord.create({
    data: { studentId, category, rating, note, recordedById: check.teacherId },
  });

  revalidatePath(`/teacher/growth`);
  revalidatePath(`/student/growth`);
  return { success: "Rating recorded." };
}
