"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { uploadPortfolioFile } from "@/lib/students/portfolio";

const STUDENT_ROLES = ["STUDENT"] as const;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB — these are documents/images, not video
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function uploadPortfolioItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const student = await prisma.student.findUnique({ where: { userId: auth.user.id }, select: { id: true } });
  if (!student) return { error: "Your student record is missing. Ask an administrator to check your profile." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give this piece of work a title." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "Upload a JPEG, PNG, WebP image, or a PDF." };
  if (file.size > MAX_BYTES) return { error: "File must be under 15MB." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const academicYear = String(formData.get("academicYear") ?? "").trim() || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  let fileUrl: string;
  try {
    fileUrl = await uploadPortfolioFile(buffer, student.id, file.name, file.type);
  } catch (err) {
    return { error: `Could not upload the file: ${(err as Error).message}` };
  }

  await prisma.portfolioItem.create({
    data: { studentId: student.id, title, description, subject, academicYear, fileUrl, fileType: file.type },
  });

  revalidatePath("/student/portfolio");
  revalidatePath("/teacher/growth");
  return { success: "Added to your portfolio." };
}

export async function deletePortfolioItem(id: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };

  const student = await prisma.student.findUnique({ where: { userId: auth.user.id }, select: { id: true } });
  if (!student) return { error: "Your student record is missing." };

  const item = await prisma.portfolioItem.findUnique({ where: { id }, select: { studentId: true } });
  if (!item || item.studentId !== student.id) return { error: "That item is not yours." };

  await prisma.portfolioItem.delete({ where: { id } });
  revalidatePath("/student/portfolio");
  return { success: true };
}
