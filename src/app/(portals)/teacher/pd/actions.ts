"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function logPDRecord(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "No teacher profile found for your account." };

  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const provider = (formData.get("provider") as string) || null;
  const hours = parseInt(formData.get("hours") as string);
  const dateCompleted = formData.get("dateCompleted") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!title || !type || isNaN(hours) || hours < 1) {
    return { error: "Title, type and a positive number of hours are required." };
  }

  await prisma.pDRecord.create({
    data: {
      teacherId: teacher.id,
      title,
      type,
      provider,
      hours,
      dateCompleted: dateCompleted ? new Date(dateCompleted) : new Date(),
      notes,
    },
  });

  revalidatePath("/teacher/pd");
  revalidatePath("/admin/staff/appraisal");
  return { success: true };
}
