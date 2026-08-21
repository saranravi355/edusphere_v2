"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import type { ActionState } from "@/components/ui/form";



export async function onboardTeacher(formData: FormData) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subjects = formData.get("subjects") as string;

  // Create User
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "SUBJECT_TEACHER",
      // Set explicitly: omitting this falls back to the schema's plaintext
      // @default("password123"), which would create an un-hashed account.
      password: await hashPassword("password123"),
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

/**
 * Send a school-wide announcement.
 *
 * This function used to be: guard, `await new Promise(r => setTimeout(r, 1000))`,
 * revalidate, `return { success: true }`. The comment above it said "In a real
 * app, this would write to an Announcements table". The typed message was
 * discarded, and the two audience checkboxes had no `name` attribute, so they
 * never reached the server to be discarded in the first place.
 *
 * It writes the announcement and fans out a Notification per recipient, which
 * is what makes those checkboxes mean something.
 */
export async function createAnnouncement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("message") ?? "").trim();
  const toTeachers = formData.get("notifyTeachers") === "on";
  const toParents = formData.get("notifyParents") === "on";
  const toStudents = formData.get("notifyStudents") === "on";

  if (!title) return { error: "Give the announcement a subject line." };
  if (!body) return { error: "The announcement is empty." };
  if (!toTeachers && !toParents && !toStudents) {
    return { error: "Choose at least one group to send it to." };
  }

  const roles: string[] = [];
  if (toTeachers) roles.push("CLASS_TEACHER", "SUBJECT_TEACHER");
  if (toParents) roles.push("PARENT");
  if (toStudents) roles.push("STUDENT");

  const audience =
    toTeachers && toParents && toStudents ? "ALL"
      : [toTeachers && "TEACHERS", toParents && "PARENTS", toStudents && "STUDENTS"].filter(Boolean).join("+");

  const recipients = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.announcement.create({
      data: { title, body, audience, authorId: auth.user.id, sentCount: recipients.length },
    });
    if (recipients.length) {
      await tx.notification.createMany({
        data: recipients.map((r) => ({ userId: r.id, title, message: body, type: "INFO" })),
      });
    }
  });

  revalidatePath("/admin");
  return {
    success: recipients.length
      ? `Sent to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}.`
      : "Saved, but nobody in those groups has an account yet.",
  };
}
