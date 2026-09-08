"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";

/** Verify this teacher actually teaches the record's student before letting them touch it. */
async function assertSupervises(teacherUserId: string, coreRecordId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    select: { id: true, classes: { select: { id: true } }, timetable: { select: { classroomId: true } } },
  });
  if (!teacher) return { error: "Your staff record is missing." } as const;

  const record = await prisma.iBCoreRecord.findUnique({
    where: { id: coreRecordId },
    select: { id: true, student: { select: { classroomId: true } } },
  });
  if (!record) return { error: "That record no longer exists." } as const;

  const classroomIds = new Set([...teacher.classes.map((c) => c.id), ...teacher.timetable.map((t) => t.classroomId)]);
  if (!record.student.classroomId || !classroomIds.has(record.student.classroomId)) {
    return { error: "You do not teach this student." } as const;
  }
  return { ok: true } as const;
}

export async function addSupervisorComment(coreRecordId: string, text: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const trimmed = text.trim();
  if (!trimmed) return { error: "Write a comment before submitting." };

  const check = await assertSupervises(auth.user.id, coreRecordId);
  if ("error" in check) return { error: check.error };

  await prisma.iBCoreEntry.create({
    data: { coreRecordId, authorRole: "TEACHER", kind: "COMMENT", text: trimmed },
  });

  revalidatePath("/teacher/ib-core");
  revalidatePath("/student/ib-core");
  return { success: true };
}

export async function approveCASEntry(entryId: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const entry = await prisma.iBCoreEntry.findUnique({ where: { id: entryId }, select: { coreRecordId: true, kind: true } });
  if (!entry) return { error: "That entry no longer exists." };
  if (entry.kind !== "REFLECTION") return { error: "Only CAS reflections can be approved." };

  const check = await assertSupervises(auth.user.id, entry.coreRecordId);
  if ("error" in check) return { error: check.error };

  await prisma.iBCoreEntry.update({ where: { id: entryId }, data: { approved: true } });

  revalidatePath("/teacher/ib-core");
  revalidatePath("/student/ib-core");
  return { success: true };
}

const EE_TOK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "COMPLETE"];

export async function updateCoreStatus(coreRecordId: string, status: string, grade: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };
  if (!EE_TOK_STATUSES.includes(status)) return { error: "Invalid status." };

  const check = await assertSupervises(auth.user.id, coreRecordId);
  if ("error" in check) return { error: check.error };

  await prisma.iBCoreRecord.update({
    where: { id: coreRecordId },
    data: { status, grade: grade.trim() || null },
  });

  revalidatePath("/teacher/ib-core");
  revalidatePath("/student/ib-core");
  return { success: true };
}
