"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createIEPPlan(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const caseManagerId = (formData.get("caseManagerId") as string) || null;
  const needType = formData.get("needType") as string;
  const summary = formData.get("summary") as string;
  const accommodations = (formData.get("accommodations") as string) || null;
  const reviewDate = formData.get("reviewDate") as string;

  if (!studentId || !needType || !summary) {
    return { error: "Student, need type and summary are required." };
  }

  await prisma.iEPPlan.create({
    data: {
      studentId,
      caseManagerId,
      needType,
      summary,
      accommodations,
      reviewDate: reviewDate ? new Date(reviewDate) : null,
    },
  });

  // Flag the student record as well so the directory reflects it
  await prisma.student.update({
    where: { id: studentId },
    data: { learningNeeds: needType },
  });

  revalidatePath("/admin/students/learning-needs");
  return { success: true };
}

export async function addIEPGoal(formData: FormData) {
  const planId = formData.get("planId") as string;
  const title = formData.get("title") as string;
  const targetDate = formData.get("targetDate") as string;

  if (!planId || !title) return { error: "Goal title is required." };

  await prisma.iEPGoal.create({
    data: {
      planId,
      title,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  revalidatePath("/admin/students/learning-needs");
  revalidatePath("/teacher/learning-needs");
  return { success: true };
}

export async function updateGoalProgress(goalId: string, progress: number) {
  const clamped = Math.max(0, Math.min(100, progress));
  await prisma.iEPGoal.update({
    where: { id: goalId },
    data: {
      progress: clamped,
      status: clamped >= 100 ? "ACHIEVED" : "IN_PROGRESS",
    },
  });
  revalidatePath("/admin/students/learning-needs");
  revalidatePath("/teacher/learning-needs");
  return { success: true };
}

export async function updatePlanStatus(planId: string, status: string) {
  await prisma.iEPPlan.update({
    where: { id: planId },
    data: { status },
  });
  revalidatePath("/admin/students/learning-needs");
  return { success: true };
}
