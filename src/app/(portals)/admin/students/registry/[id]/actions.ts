"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { uploadStudentPhoto } from "@/lib/students/photo";

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Updates the editable fields of a student's profile. Deliberately does not touch
 * classroom assignment, curriculum programme, registrationNo, or the linked Parent
 * account - those are each already owned by another flow elsewhere in the app
 * (enrolment, promotion, the Parent's own user account), and duplicating their editing
 * here would let this form and that flow disagree about the source of truth.
 */
export async function updateStudentProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("studentId") ?? "");
  const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "That student record no longer exists." };

  const dobRaw = str(formData, "dateOfBirth");

  await prisma.student.update({
    where: { id },
    data: {
      dateOfBirth: dobRaw ? new Date(dobRaw) : null,
      gender: str(formData, "gender"),
      section: str(formData, "section"),
      rollNumber: str(formData, "rollNumber"),
      academicYear: str(formData, "academicYear"),

      phone: str(formData, "phone"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      country: str(formData, "country"),

      fatherName: str(formData, "fatherName"),
      fatherPhone: str(formData, "fatherPhone"),
      fatherEmail: str(formData, "fatherEmail"),
      motherName: str(formData, "motherName"),
      motherPhone: str(formData, "motherPhone"),
      motherEmail: str(formData, "motherEmail"),
      motherOccupation: str(formData, "motherOccupation"),
      emergencyContactName: str(formData, "emergencyContactName"),
      emergencyContactPhone: str(formData, "emergencyContactPhone"),

      previousSchool: str(formData, "previousSchool"),
      bloodGroup: str(formData, "bloodGroup"),
      learningNeeds: str(formData, "learningNeeds"),
      allergies: str(formData, "allergies"),
    },
  });

  revalidatePath(`/admin/students/registry/${id}`);
  revalidatePath("/admin/students/registry");
  return { success: "Profile updated." };
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadStudentPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("studentId") ?? "");
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload." };
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return { error: "Photo must be a JPEG, PNG, or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo must be under 5MB." };

  const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "That student record no longer exists." };

  const buffer = Buffer.from(await file.arrayBuffer());
  let photoUrl: string;
  try {
    photoUrl = await uploadStudentPhoto(buffer, id, file.type);
  } catch (err) {
    return { error: `Could not upload the photo: ${(err as Error).message}` };
  }

  await prisma.student.update({ where: { id }, data: { photoUrl } });

  revalidatePath(`/admin/students/registry/${id}`);
  revalidatePath("/admin/students/registry");
  return { success: "Photo updated." };
}

export async function removeStudentPhoto(id: string): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  await prisma.student.update({ where: { id }, data: { photoUrl: null } });
  revalidatePath(`/admin/students/registry/${id}`);
  revalidatePath("/admin/students/registry");
  return { success: "Photo removed." };
}
