"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

async function myTicket(teacherUserId: string, ticketId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId }, select: { id: true } });
  if (!teacher) return { error: "Your staff record is missing." } as const;

  const ticket = await prisma.queryTicket.findUnique({
    where: { id: ticketId },
    select: { teacherId: true, subject: true, student: { select: { userId: true } } },
  });
  if (!ticket || ticket.teacherId !== teacher.id) return { error: "That ticket is not yours." } as const;

  return ticket as { teacherId: string; subject: string; student: { userId: string | null } };
}

export async function addTeacherReply(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const ticketId = String(formData.get("ticketId") ?? "");
  const trimmed = String(formData.get("text") ?? "").trim();
  if (!trimmed) return { error: "Write a reply before submitting." };

  const ticket = await myTicket(auth.user.id, ticketId);
  if ("error" in ticket) return { error: ticket.error };

  await prisma.queryTicketMessage.create({ data: { ticketId, authorRole: "TEACHER", text: trimmed } });
  await prisma.queryTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });

  if (ticket.student.userId) {
    await prisma.notification.create({
      data: {
        userId: ticket.student.userId,
        title: "Your teacher replied",
        message: `"${ticket.subject}" — ${auth.user.name} replied to your ticket.`,
        type: "SUCCESS",
      },
    });
  }

  revalidatePath("/teacher/query-tickets");
  revalidatePath("/student/query-tickets");
  return { success: "Reply sent." };
}

export async function resolveTicket(ticketId: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const ticket = await myTicket(auth.user.id, ticketId);
  if ("error" in ticket) return { error: ticket.error };

  await prisma.queryTicket.update({ where: { id: ticketId }, data: { status: "RESOLVED" } });

  revalidatePath("/teacher/query-tickets");
  revalidatePath("/student/query-tickets");
  return { success: true };
}
