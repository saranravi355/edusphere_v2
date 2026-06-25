"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";



export async function onboardTeacher(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subjects = formData.get("subjects") as string;

  // Create User
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "SUBJECT_TEACHER",
    }
  });

  // Create Teacher Profile
  await prisma.teacher.create({
    data: {
      userId: user.id,
      subjects,
    }
  });

  // Revalidate to update counts
  revalidatePath("/admin");
  return { success: true };
}

export async function createAnnouncement(formData: FormData) {
  // In a real app, this would write to an Announcements table.
  // For the demo, we will just mock a success state and wait 1 second to simulate network.
  await new Promise(resolve => setTimeout(resolve, 1000));
  revalidatePath("/admin");
  return { success: true };
}
