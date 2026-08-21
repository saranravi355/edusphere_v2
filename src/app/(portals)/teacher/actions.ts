"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";



export async function markAttendance(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const studentId = formData.get("studentId") as string;
  const status = formData.get("status") as string;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findFirst({
    where: {
      studentId,
      date: { gte: today }
    }
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status }
    });
  } else {
    await prisma.attendance.create({
      data: {
        studentId,
        date: new Date(),
        status,
        recordedBy: session.user.id
      }
    });
  }

  revalidatePath("/teacher");
}

/**
 * assignGrade used to live here. It was dead — teacher/page.tsx defines its own
 * inline server action of the same name — and it was demo-shaped: it ignored the
 * subject entirely, looked up "Biology", and wrote a grade called "Midterm
 * Update". The live path writes an AssessmentResult against the real assessment.
 */

export async function bulkMarkPresent(classId: string) {
  const session = await getSession();
  if (!session) return;

  const students = await prisma.student.findMany({ where: { classroomId: classId } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const student of students) {
    const existing = await prisma.attendance.findFirst({
      where: { studentId: student.id, date: { gte: today } }
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: 'PRESENT' }
      });
    } else {
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date: new Date(),
          status: 'PRESENT',
          recordedBy: session.user.id
        }
      });
    }
  }

  revalidatePath("/teacher");
}

/*
 * `uploadAssignment` used to live here: a 1.5-second sleep that returned
 * { success: true } and wrote nothing. Its only consumer, TeacherAssignmentModal,
 * was never rendered anywhere. Both are gone — assignments are created through
 * /teacher/assignments, which writes.
 */

export async function sendMessage(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const receiverId = String(formData.get("receiverId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!receiverId || !content) return;

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      subject: "Teacher message",
      content,
      isRead: false,
    },
  });

  revalidatePath("/teacher/messages");
}
