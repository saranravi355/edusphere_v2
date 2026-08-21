"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { formatDate, formatTime } from "@/lib/dates";
import { slotToUtc, MEETING_MINUTES } from "@/lib/meetings";

/**
 * Book a parent-teacher consultation.
 *
 * The page this belongs to drew the whole flow and wired none of it: a teacher
 * select holding three hardcoded names, a date input, four time-slot buttons
 * with one struck through as "taken", and a "Confirm Booking" that was
 * `type="button"` with no onClick inside a `<form>` with no action. Pressing it
 * did nothing — not even a fake toast. Above it sat an "upcoming meeting" with
 * a named teacher, a date and a "Zoom Link Generated" badge, all hardcoded.
 */
export async function bookMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(["PARENT"]);
  if (!auth.ok) return { error: auth.error };

  const parent = await prisma.parent.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, students: { select: { id: true } } },
  });
  if (!parent) return { error: "We could not find your parent record." };

  const teacherId = String(formData.get("teacherId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const date = String(formData.get("date") ?? "");
  const slot = String(formData.get("slot") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();

  if (!teacherId) return { error: "Choose a teacher." };
  if (!studentId) return { error: "Choose which child this is about." };
  if (!date) return { error: "Choose a date." };
  if (!slot) return { error: "Choose a time." };

  if (!parent.students.some((s) => s.id === studentId)) {
    return { error: "That is not one of your children." };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });
  if (!teacher) return { error: "That teacher is no longer on staff." };

  const scheduledAt = slotToUtc(date, slot);
  if (!scheduledAt) return { error: "That is not a valid date and time." };
  if (scheduledAt.getTime() < Date.now()) return { error: "That slot is in the past." };

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });

  try {
    await prisma.parentTeacherMeeting.create({
      data: {
        parentId: parent.id,
        teacherId: teacher.id,
        studentId,
        scheduledAt,
        durationMinutes: MEETING_MINUTES,
        topic: topic || null,
        status: "BOOKED",
      },
    });
  } catch {
    // The unique index on (teacherId, scheduledAt) is what actually prevents
    // double booking — two parents can press Confirm in the same second.
    return { error: "Somebody just took that slot. Pick another time." };
  }

  await prisma.notification.create({
    data: {
      userId: teacher.userId,
      title: "Parent meeting booked",
      message: `${auth.user.name} booked ${formatTime(scheduledAt)} on ${formatDate(scheduledAt, "dMon")} about ${student?.name ?? "their child"}.`,
      type: "INFO",
    },
  });

  revalidatePath("/parent/meetings");
  return { success: `Booked with ${teacher.user.name} at ${formatTime(scheduledAt)} on ${formatDate(scheduledAt, "dMon")}.` };
}

/** Cancel a booking you made. */
export async function cancelMeeting(id: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(["PARENT"]);
  if (!auth.ok) return { error: auth.error };

  const parent = await prisma.parent.findUnique({ where: { userId: auth.user.id }, select: { id: true } });
  if (!parent) return { error: "We could not find your parent record." };

  const meeting = await prisma.parentTeacherMeeting.findUnique({
    where: { id },
    select: { parentId: true, scheduledAt: true, teacher: { select: { userId: true } } },
  });
  if (!meeting || meeting.parentId !== parent.id) return { error: "That booking is not yours." };

  // Deleted rather than marked cancelled, so the slot is genuinely free again —
  // the unique index would otherwise keep holding it.
  await prisma.parentTeacherMeeting.delete({ where: { id } });

  await prisma.notification.create({
    data: {
      userId: meeting.teacher.userId,
      title: "Parent meeting cancelled",
      message: `${auth.user.name} cancelled the ${formatTime(meeting.scheduledAt)} slot on ${formatDate(meeting.scheduledAt, "dMon")}.`,
      type: "ALERT",
    },
  });

  revalidatePath("/parent/meetings");
  return { success: true };
}
