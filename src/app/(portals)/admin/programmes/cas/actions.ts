"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, STAFF_ROLES } from "@/lib/authz";

// CAS coordinator nudges a student — creates a real in-app notification
export async function sendCASNudge(studentId: string, message: string) {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

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
