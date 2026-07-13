"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// CAS coordinator nudges a student — creates a real in-app notification
export async function sendCASNudge(studentId: string, message: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true, name: true },
  });
  if (!student?.userId) return { error: "This student has no portal account to notify." };

  await prisma.notification.create({
    data: {
      userId: student.userId,
      title: "CAS Coordinator reminder",
      message,
      type: "CAS",
    },
  });

  revalidatePath("/admin/programmes/cas");
  return { success: true };
}
