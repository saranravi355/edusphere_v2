"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";

/**
 * Add or update a campus.
 *
 * /admin/schools listed two campuses — 1,250 and 840 students, both Active —
 * from a hardcoded array, with an "+ Add Campus" button and a per-campus
 * "Manage Settings" button, neither of which had a handler, an href or a form.
 * There was no School model in the schema at all.
 */
export async function upsertSchool(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const campusCode = String(formData.get("campusCode") ?? "").trim().toUpperCase();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const principalName = String(formData.get("principalName") ?? "").trim();

  if (!name) return { error: "Name the campus." };
  if (!/^[A-Z0-9-]{2,12}$/.test(campusCode)) {
    return { error: "Campus code should be 2–12 letters, digits or dashes, e.g. MAIN or NORTH-2." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address does not look right." };

  const clash = await prisma.school.findUnique({ where: { campusCode }, select: { id: true } });
  if (clash && clash.id !== id) return { error: `Campus code ${campusCode} is already in use.` };

  const data = {
    name, campusCode,
    address: address || null,
    phone: phone || null,
    email: email || null,
    principalName: principalName || null,
  };

  if (id) {
    const exists = await prisma.school.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { error: "That campus no longer exists." };
    await prisma.school.update({ where: { id }, data });
  } else {
    await prisma.school.create({ data });
  }

  revalidatePath("/admin/schools");
  return { success: id ? `${name} updated.` : `${name} added.` };
}

/** Open or close a campus without deleting its history. */
export async function setSchoolActive(id: string, isActive: boolean): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };
  await prisma.school.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/schools");
  return { success: true };
}

/** Move a class to a campus. */
export async function assignClassroom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const classroomId = String(formData.get("classroomId") ?? "");
  const schoolId = String(formData.get("schoolId") ?? "");
  if (!classroomId) return { error: "Choose a class." };
  if (!schoolId) return { error: "Choose a campus." };

  const [classroom, school] = await Promise.all([
    prisma.classroom.findUnique({ where: { id: classroomId }, select: { name: true } }),
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
  ]);
  if (!classroom) return { error: "That class no longer exists." };
  if (!school) return { error: "That campus no longer exists." };

  await prisma.classroom.update({ where: { id: classroomId }, data: { schoolId } });
  revalidatePath("/admin/schools");
  return { success: `${classroom.name} moved to ${school.name}.` };
}
