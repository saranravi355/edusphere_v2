"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, TEACHER_ROLES, ADMIN_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { LEAVE_TYPE_VALUES, leaveTypeLabel, workingDaysBetween } from "@/lib/leave";
import { formatDate } from "@/lib/dates";

/**
 * Submit a leave request.
 *
 * What this replaces: `onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}`
 * followed by a green tick and the words "Your leave request has been sent to
 * the Principal for approval". None of the five fields had a name attribute, so
 * the values were not even readable client-side, and the Principal's queue —
 * which does read LeaveRequest, and does work — could never receive anything.
 */
export async function requestLeave(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true },
  });
  if (!teacher) return { error: "Your staff record is missing. Ask an administrator to check your profile." };

  const leaveType = String(formData.get("leaveType") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const substituteRaw = String(formData.get("substituteTeacherId") ?? "").trim();
  const startDate = new Date(String(formData.get("startDate") ?? ""));
  const endDate = new Date(String(formData.get("endDate") ?? ""));

  if (!LEAVE_TYPE_VALUES.includes(leaveType)) return { error: "Choose a leave type." };
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { error: "Choose both a start and an end date." };
  if (endDate < startDate) return { error: "The end date cannot be before the start date." };
  if (!reason) return { error: "Give a reason — the Principal sees this when deciding." };

  const days = workingDaysBetween(startDate, endDate);
  if (days === 0) return { error: "That range contains no working days." };
  if (days > 60) return { error: "That is more than 60 working days. Please raise long leave with the Principal directly." };

  if (substituteRaw && substituteRaw === teacher.id) {
    return { error: "You cannot cover your own absence." };
  }
  const substituteTeacherId = substituteRaw || null;
  if (substituteTeacherId) {
    const sub = await prisma.teacher.findUnique({ where: { id: substituteTeacherId }, select: { id: true } });
    if (!sub) return { error: "That substitute is no longer on staff." };
  }

  // Overlapping requests are a real filing mistake, not a hypothetical: the
  // dates come from two free date pickers with nothing joining them up.
  const clash = await prisma.leaveRequest.findFirst({
    where: {
      teacherId: teacher.id,
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { startDate: true, endDate: true, status: true },
  });
  if (clash) {
    return {
      error: `You already have ${clash.status.toLowerCase()} leave covering ${formatDate(clash.startDate, "dMon")}–${formatDate(clash.endDate, "dMon")}.`,
    };
  }

  await prisma.leaveRequest.create({
    data: { teacherId: teacher.id, leaveType, startDate, endDate, reason, substituteTeacherId, status: "PENDING" },
  });

  // Tell the people who have to act on it, rather than claiming they were told.
  const approvers = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "PRINCIPAL"] } },
    select: { id: true },
  });
  if (approvers.length) {
    await prisma.notification.createMany({
      data: approvers.map((a) => ({
        userId: a.id,
        title: "Leave request awaiting approval",
        message: `${auth.user.name} has requested ${days} day${days === 1 ? "" : "s"} of ${leaveTypeLabel(leaveType).toLowerCase()} from ${formatDate(startDate, "dMon")}.`,
        type: "ALERT",
      })),
    });
  }

  revalidatePath("/teacher/leave");
  revalidatePath("/admin/staff/leave");
  revalidatePath("/admin");

  return { success: `Sent to the Principal — ${days} working day${days === 1 ? "" : "s"} of ${leaveTypeLabel(leaveType).toLowerCase()}.` };
}

/** Withdraw a request that has not been decided yet. */
export async function withdrawLeave(id: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return { error: auth.error };

  const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id }, select: { id: true } });
  if (!teacher) return { error: "Your staff record is missing." };

  const req = await prisma.leaveRequest.findUnique({ where: { id }, select: { teacherId: true, status: true } });
  if (!req || req.teacherId !== teacher.id) return { error: "That request is not yours." };
  if (req.status !== "PENDING") return { error: "That request has already been decided." };

  await prisma.leaveRequest.delete({ where: { id } });
  revalidatePath("/teacher/leave");
  revalidatePath("/admin/staff/leave");
  return { success: true };
}

/**
 * Approve or reject, from the Principal's queue.
 *
 * The queue already wrote `status`. It did not record who decided or when, and
 * it never told the teacher — so a request could sit approved for a week with
 * the teacher still waiting to hear.
 */
export async function decideLeave(id: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const req = await prisma.leaveRequest.findUnique({
    where: { id },
    select: { status: true, leaveType: true, startDate: true, endDate: true, teacher: { select: { userId: true } } },
  });
  if (!req) return { error: "That request no longer exists." };
  if (req.status !== "PENDING") return { error: `That request was already ${req.status.toLowerCase()}.` };

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: decision, decidedAt: new Date(), decidedById: auth.user.id },
  });

  await prisma.notification.create({
    data: {
      userId: req.teacher.userId,
      title: `Leave ${decision.toLowerCase()}`,
      message: `Your ${leaveTypeLabel(req.leaveType).toLowerCase()} from ${formatDate(req.startDate, "dMon")} to ${formatDate(req.endDate, "dMon")} was ${decision.toLowerCase()} by ${auth.user.name}.`,
      type: decision === "APPROVED" ? "SUCCESS" : "ALERT",
    },
  });

  revalidatePath("/admin/staff/leave");
  revalidatePath("/teacher/leave");
  return { success: true };
}
