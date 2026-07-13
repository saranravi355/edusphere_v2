"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createObservation(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const observerName = formData.get("observerName") as string;
  const className = (formData.get("className") as string) || null;
  const focusArea = (formData.get("focusArea") as string) || null;
  const planningScore = parseInt(formData.get("planningScore") as string);
  const deliveryScore = parseInt(formData.get("deliveryScore") as string);
  const engagementScore = parseInt(formData.get("engagementScore") as string);
  const assessmentScore = parseInt(formData.get("assessmentScore") as string);
  const strengths = (formData.get("strengths") as string) || null;
  const growthAreas = (formData.get("growthAreas") as string) || null;

  if (!teacherId || !observerName) {
    return { error: "Teacher and observer name are required." };
  }

  const scores = [planningScore, deliveryScore, engagementScore, assessmentScore];
  if (scores.some((s) => isNaN(s) || s < 1 || s > 7)) {
    return { error: "All scores must be on the IB 1–7 scale." };
  }

  await prisma.observation.create({
    data: {
      teacherId,
      observerName,
      className,
      focusArea,
      planningScore,
      deliveryScore,
      engagementScore,
      assessmentScore,
      strengths,
      growthAreas,
    },
  });

  revalidatePath("/admin/staff/appraisal");
  revalidatePath("/teacher/pd");
  return { success: true };
}
