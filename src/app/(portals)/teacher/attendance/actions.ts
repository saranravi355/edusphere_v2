"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import { SESSIONS, ATTENDANCE_STATUSES, markOne, markManyPresent } from "@/lib/attendance";

async function teacherContext() {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, classes: { select: { id: true } } },
  });
  if (!teacher) return null;
  return { userId: auth.user.id, classIds: teacher.classes.map((c) => c.id) };
}

/**
 * Mark one student for one session.
 *
 * The four buttons on this screen — morning tick, morning cross, afternoon
 * tick, afternoon cross — were bare `<button>` elements in a Server Component.
 * None had an onClick, none was in a form, and both pairs coloured themselves
 * from the same single record, so the afternoon column simply mirrored the
 * morning one. Nothing on the page could write.
 */
export async function setAttendance(studentId: string, session: string, status: string) {
  const ctx = await teacherContext();
  if (!ctx) return;
  if (!(SESSIONS as readonly string[]).includes(session)) return;
  if (!(ATTENDANCE_STATUSES as readonly string[]).includes(status)) return;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classroomId: true } });
  if (!student || !ctx.classIds.includes(student.classroomId ?? "")) return;

  // Pressing the same button again clears the mark, so a mis-tap is
  // correctable rather than permanent.
  await markOne({ studentId, status, session, recordedBy: ctx.userId, toggle: true });

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
}

/** Mark everyone in a class present for a session, skipping anyone already marked. */
export async function markSessionPresent(classroomId: string, session: string) {
  const ctx = await teacherContext();
  if (!ctx || !ctx.classIds.includes(classroomId)) return;
  if (!(SESSIONS as readonly string[]).includes(session)) return;

  const students = await prisma.student.findMany({
    where: { classroomId, isActive: true },
    select: { id: true },
  });
  if (!students.length) return;

  await markManyPresent({ studentIds: students.map((s) => s.id), session, recordedBy: ctx.userId });

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
}
