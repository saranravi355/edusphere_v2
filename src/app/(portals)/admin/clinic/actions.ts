"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, STAFF_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

/**
 * Record a visit to the school nurse.
 *
 * The dialog this replaces had no form element, no name attributes and no
 * action — the fields were uncontrolled and nothing ever read them. Its Save
 * came from the generic Modal and showed "Data successfully submitted!", so a
 * nurse could log a child's fever and medication, see a success message, and
 * leave no record of it. The student dropdown offered a single hardcoded name.
 */
export async function logClinicVisit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const treatment = String(formData.get("treatment") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId) return { error: "Choose the student who was seen." };
  if (!reason) return { error: "Record why the student came to the clinic." };
  if (!treatment) return { error: "Record what was administered, or “None” if nothing was." };

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });
  if (!student) return { error: "That student no longer exists." };

  await prisma.clinicVisit.create({
    data: { studentId, reason, treatment, notes: notes || null, date: new Date() },
  });

  revalidatePath("/admin/clinic");
  return { success: `Visit logged for ${student.name}.` };
}
