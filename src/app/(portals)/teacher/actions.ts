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

export async function assignGrade(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const studentId = formData.get("studentId") as string;
  const score = parseFloat(formData.get("score") as string);

  // For this demo, let's just find the first Biology grade and update it
  const bioSubject = await prisma.subject.findFirst({ where: { name: 'Biology' } });
  if (!bioSubject) return;

  const existing = await prisma.grade.findFirst({
    where: { studentId, subjectId: bioSubject.id }
  });

  if (existing) {
    await prisma.grade.update({
      where: { id: existing.id },
      data: { score }
    });
  } else {
    await prisma.grade.create({
      data: {
        studentId,
        subjectId: bioSubject.id,
        examName: "Midterm Update",
        score,
        maxScore: 100
      }
    });
  }

  revalidatePath("/teacher");
}

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

export async function uploadAssignment(formData: FormData) {
  // Mock upload delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  revalidatePath("/teacher");
  return { success: true };
}
