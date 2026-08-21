"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { workingDaysBetween } from "@/lib/leave";

/** Working days in a yyyy-mm period, Mon–Fri. */
function workingDaysInPeriod(period: string): number {
  const [y, m] = period.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return workingDaysBetween(start, end);
}

function periodBounds(period: string): { start: Date; end: Date } {
  const [y, m] = period.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 0, 23, 59, 59)) };
}

/**
 * Run payroll for a month.
 *
 * What this replaces: a button whose handler was
 * `setTimeout(() => setComplete(true), 2500)`, after which the page rendered
 * three hardcoded staff rows (Meena Krishnan ₹8,500, Rajesh Kumar −₹280,
 * Sindhu Sharma ₹4,500) and a hardcoded total of "₹2,45,600 across 85 Staff
 * Members" — for a school with 15 teachers. A banner announced it was
 * "Syncing with Leave Module to calculate UTO deductions"; the leave module was
 * never read, and there was no payroll table to write to.
 *
 * Unpaid leave is now genuinely read from LeaveRequest: approved UNPAID days
 * that fall inside the period, pro-rated against the month's working days.
 */
export async function runPayroll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const period = String(formData.get("period") ?? "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return { error: "Choose a month." };

  const existing = await prisma.payrollRun.findUnique({ where: { period }, select: { status: true } });
  if (existing?.status === "DISBURSED") return { error: `${period} has already been disbursed and cannot be re-run.` };

  const teachers = await prisma.teacher.findMany({
    select: { id: true, baseSalary: true, user: { select: { name: true } } },
  });
  const paid = teachers.filter((t) => t.baseSalary && t.baseSalary > 0);
  if (!paid.length) {
    return { error: "No teacher has a salary on record. Set one on the staff list first." };
  }

  const { start, end } = periodBounds(period);
  const unpaidLeave = await prisma.leaveRequest.findMany({
    where: {
      teacherId: { in: paid.map((t) => t.id) },
      status: "APPROVED",
      leaveType: "UNPAID",
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { teacherId: true, startDate: true, endDate: true },
  });

  const daysInMonth = workingDaysInPeriod(period);
  const unpaidByTeacher = new Map<string, number>();
  for (const l of unpaidLeave) {
    // Only the part of the absence that falls inside this month.
    const from = l.startDate > start ? l.startDate : start;
    const to = l.endDate < end ? l.endDate : end;
    unpaidByTeacher.set(l.teacherId, (unpaidByTeacher.get(l.teacherId) ?? 0) + workingDaysBetween(from, to));
  }

  const lines = paid.map((t) => {
    const baseSalary = t.baseSalary!;
    const unpaidDays = Math.min(unpaidByTeacher.get(t.id) ?? 0, daysInMonth);
    const deductions = daysInMonth > 0 ? Math.round((baseSalary / daysInMonth) * unpaidDays) : 0;
    return { teacherId: t.id, baseSalary, unpaidDays, deductions, netPay: Math.max(0, baseSalary - deductions) };
  });
  const totalNet = lines.reduce((n, l) => n + l.netPay, 0);

  await prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.upsert({
      where: { period },
      create: { period, status: "DRAFT", totalNet, runById: auth.user.id },
      update: { totalNet, runById: auth.user.id, status: "DRAFT" },
      select: { id: true },
    });
    // Re-running a draft replaces its lines rather than stacking them.
    await tx.payrollLine.deleteMany({ where: { runId: run.id } });
    await tx.payrollLine.createMany({ data: lines.map((l) => ({ ...l, runId: run.id })) });
  });

  revalidatePath("/admin/finance/payroll");
  const withDeductions = lines.filter((l) => l.deductions > 0).length;
  return {
    success:
      `Calculated ${lines.length} salaries for ${period}: ₹${totalNet.toLocaleString("en-IN")} net` +
      (withDeductions ? `, ${withDeductions} with unpaid-leave deductions.` : "."),
  };
}

/** Mark a run disbursed. Irreversible by design — it is a payment record. */
export async function disburse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const period = String(formData.get("period") ?? "");
  const run = await prisma.payrollRun.findUnique({
    where: { period },
    select: { id: true, status: true, totalNet: true, _count: { select: { lines: true } } },
  });
  if (!run) return { error: "Run that month first." };
  if (run.status === "DISBURSED") return { error: "That month has already been disbursed." };
  if (run._count.lines === 0) return { error: "That run has no lines." };

  await prisma.payrollRun.update({
    where: { id: run.id },
    data: { status: "DISBURSED", disbursedAt: new Date() },
  });

  revalidatePath("/admin/finance/payroll");
  return { success: `₹${run.totalNet.toLocaleString("en-IN")} marked disbursed for ${period}.` };
}

/** Record a teacher's monthly salary. There was nowhere to put one. */
export async function setSalary(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const teacherId = String(formData.get("teacherId") ?? "");
  const raw = String(formData.get("baseSalary") ?? "").trim();
  if (!teacherId) return { error: "Choose a member of staff." };

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
    return { error: "Enter a monthly gross between 0 and 1,00,00,000." };
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { user: { select: { name: true } } } });
  if (!teacher) return { error: "That member of staff no longer exists." };

  await prisma.teacher.update({ where: { id: teacherId }, data: { baseSalary: amount || null } });
  revalidatePath("/admin/finance/payroll");
  return { success: `${teacher.user.name}: ₹${amount.toLocaleString("en-IN")} per month.` };
}
