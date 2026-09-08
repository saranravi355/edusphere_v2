"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

const STUDENT_ROLES = ["STUDENT"] as const;

async function myStudent(userId: string) {
  const student = await prisma.student.findUnique({ where: { userId }, select: { id: true, classroomId: true } });
  if (!student) return { error: "Your student record is missing. Ask an administrator to check your profile." } as const;
  return student;
}

/** A student may only raise a ticket with a teacher who actually teaches their class. */
async function assertEligibleTeacher(classroomId: string | null, teacherId: string) {
  if (!classroomId) return false;
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      OR: [{ classes: { some: { id: classroomId } } }, { timetable: { some: { classroomId } } }],
    },
    select: { id: true },
  });
  return !!teacher;
}

export async function raiseTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const student = await myStudent(auth.user.id);
  if ("error" in student) return { error: student.error };

  const teacherId = String(formData.get("teacherId") ?? "").trim();
  if (!teacherId) return { error: "Choose a teacher." };
  if (!(await assertEligibleTeacher(student.classroomId, teacherId))) {
    return { error: "That teacher does not teach your class." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) return { error: "Give your ticket a subject." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Describe your question or issue." };

  const ticket = await prisma.queryTicket.create({
    data: {
      studentId: student.id,
      teacherId,
      subject,
      messages: { create: { authorRole: "STUDENT", text: message } },
    },
    select: { id: true, teacher: { select: { userId: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: ticket.teacher.userId,
      title: "New question from a student",
      message: `"${subject}" — ${auth.user.name} raised a ticket for you.`,
      type: "ALERT",
    },
  });

  revalidatePath("/student/query-tickets");
  revalidatePath("/teacher/query-tickets");
  return { success: "Ticket sent to your teacher." };
}

export async function addStudentReply(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const ticketId = String(formData.get("ticketId") ?? "");
  const trimmed = String(formData.get("text") ?? "").trim();
  if (!trimmed) return { error: "Write a message before submitting." };

  const student = await myStudent(auth.user.id);
  if ("error" in student) return { error: student.error };

  const ticket = await prisma.queryTicket.findUnique({
    where: { id: ticketId },
    select: { studentId: true, status: true, subject: true, teacher: { select: { userId: true } } },
  });
  if (!ticket || ticket.studentId !== student.id) return { error: "That ticket is not yours." };

  await prisma.queryTicketMessage.create({ data: { ticketId, authorRole: "STUDENT", text: trimmed } });

  // A student following up on a ticket the teacher closed means it wasn't
  // actually resolved — reopen it so it surfaces again on the teacher's side.
  const reopened = ticket.status === "RESOLVED";
  await prisma.queryTicket.update({ where: { id: ticketId }, data: reopened ? { status: "OPEN" } : {} });

  await prisma.notification.create({
    data: {
      userId: ticket.teacher.userId,
      title: reopened ? "Ticket reopened" : "New reply on a ticket",
      message: `"${ticket.subject}" — ${auth.user.name} replied.`,
      type: "ALERT",
    },
  });

  revalidatePath("/student/query-tickets");
  revalidatePath("/teacher/query-tickets");
  return { success: "Reply sent." };
}
