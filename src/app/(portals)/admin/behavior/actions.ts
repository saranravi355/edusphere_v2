"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, STAFF_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { findCategory } from "@/lib/behavior";

/**
 * Log a merit or demerit.
 *
 * Until now this dialog had no form, no name attributes and no action: the
 * "Save" button belonged to the generic Modal and called
 * alert("Data successfully submitted!"). Every incident staff believed they had
 * recorded was discarded, and the two students offered in the dropdown
 * ("Rahul Patel (Grade 10)", "Kavya Singh (Grade 11)") do not attend this
 * school.
 *
 * Points are stored signed — merits positive, demerits negative — so a running
 * conduct total is a plain sum. Seed data is inconsistent about this, which is
 * why every aggregate elsewhere groups by `type` rather than trusting the sign.
 */
export async function logIncident(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  const type = String(formData.get("type") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const magnitude = Math.abs(Number(formData.get("points") ?? 0));

  if (!studentId) return { error: "Choose the student this concerns." };
  if (!teacherId) return { error: "Choose who is reporting this." };
  if (type !== "MERIT" && type !== "DEMERIT") return { error: "Choose merit or demerit." };
  if (!findCategory(category)) return { error: "Choose a category." };
  if (!description) return { error: "Describe what happened — this is what the student and their parents will read." };
  if (!Number.isFinite(magnitude) || magnitude < 1 || magnitude > 20) {
    return { error: "Points must be between 1 and 20." };
  }

  const [student, teacher] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { id: true, name: true } }),
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }),
  ]);
  if (!student) return { error: "That student no longer exists." };
  if (!teacher) return { error: "That member of staff no longer exists." };

  await prisma.behaviorIncident.create({
    data: {
      studentId,
      teacherId,
      type,
      category,
      description,
      points: type === "DEMERIT" ? -magnitude : magnitude,
      date: new Date(),
    },
  });

  revalidatePath("/admin/behavior");
  revalidatePath("/teacher/discipline");
  revalidatePath("/parent/discipline");

  return { success: `Logged for ${student.name}.` };
}
