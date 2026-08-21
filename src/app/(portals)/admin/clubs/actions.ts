"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { CLUB_ACTIVITY_TYPES } from "@/lib/options";

/**
 * Schedule a club activity.
 *
 * The empty state on this page reads "Nothing scheduled — add an event", and
 * there was no way to add one anywhere in the app: ClubActivity rows could only
 * come from the seed script. The two tabs and the accordion worked; the module
 * was otherwise read-only.
 */
export async function addClubActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const clubId = String(formData.get("clubId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const date = String(formData.get("date") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!clubId) return { error: "Choose a club." };
  if (!title) return { error: "Give the activity a title." };
  if (!(CLUB_ACTIVITY_TYPES as readonly string[]).includes(type)) return { error: "Choose an activity type." };

  const when = new Date(date);
  if (isNaN(when.getTime())) return { error: "Choose a date." };

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { name: true, members: { select: { student: { select: { userId: true } } } } },
  });
  if (!club) return { error: "That club no longer exists." };

  await prisma.clubActivity.create({
    data: { clubId, title, type, date: when, location: location || null, description: description || null },
  });

  // Members find out, which is the point of scheduling something.
  const recipients = club.members.map((m) => m.student.userId).filter((id): id is string => Boolean(id));
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        title: `${club.name}: ${title}`,
        message: `${type.charAt(0)}${type.slice(1).toLowerCase()} on ${when.toISOString().slice(0, 10)}${location ? ` at ${location}` : ""}.`,
        type: "INFO",
      })),
    });
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/student/clubs");
  return {
    success: `${title} scheduled${recipients.length ? ` — ${recipients.length} member${recipients.length === 1 ? "" : "s"} notified.` : "."}`,
  };
}

/** Record how an activity went, after the fact. */
export async function recordOutcome(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("activityId") ?? "");
  const outcome = String(formData.get("outcome") ?? "").trim();
  if (!id) return { error: "Choose an activity." };
  if (!outcome) return { error: "Say what happened." };

  const activity = await prisma.clubActivity.findUnique({ where: { id }, select: { title: true } });
  if (!activity) return { error: "That activity no longer exists." };

  await prisma.clubActivity.update({ where: { id }, data: { outcome } });
  revalidatePath("/admin/clubs");
  revalidatePath("/student/clubs");
  return { success: `Outcome recorded for ${activity.title}.` };
}
