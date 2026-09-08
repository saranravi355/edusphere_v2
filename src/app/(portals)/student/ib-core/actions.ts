"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { IB_CORE_ELEMENTS, CAS_STRANDS, type IBCoreElement } from "@/lib/ib";

const STUDENT_ROLES = ["STUDENT"] as const;

async function myDPStudent(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, curriculum: true },
  });
  if (!student) return { error: "Your student record is missing. Ask an administrator to check your profile." } as const;
  if (student.curriculum !== "DP") return { error: "The Diploma core only applies to DP students." } as const;
  return { id: student.id } as const;
}

/**
 * Log a CAS reflection. Creates the student's CAS record on first use, adds
 * the logged hours onto the matching strand total (the CAS Coordinator
 * dashboard sums those same three columns), and appends the entry itself.
 */
export async function addCASReflection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };
  const student = await myDPStudent(auth.user.id);
  if ("error" in student) return { error: student.error };

  const strand = String(formData.get("strand") ?? "");
  const strandDef = CAS_STRANDS.find((s) => s.value === strand);
  if (!strandDef) return { error: "Choose a CAS strand." };

  const hours = Number(formData.get("hours"));
  if (!Number.isFinite(hours) || hours <= 0 || hours > 100) return { error: "Enter a realistic number of hours (1–100)." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Add a short reflection on what you did and what you learned." };

  const record = await prisma.iBCoreRecord.upsert({
    where: { studentId_element: { studentId: student.id, element: "CAS" } },
    create: { studentId: student.id, element: "CAS", [strandDef.field]: hours, reflections: 1 },
    update: { [strandDef.field]: { increment: hours }, reflections: { increment: 1 } },
  });

  await prisma.iBCoreEntry.create({
    data: { coreRecordId: record.id, authorRole: "STUDENT", kind: "REFLECTION", strand, hours, text },
  });

  revalidatePath("/student/ib-core");
  revalidatePath("/admin/programmes/cas");
  revalidatePath("/teacher/ib-core");
  return { success: "Reflection logged." };
}

/** Add an Extended Essay milestone, or a TOK journal entry. Creates the record on first use. */
export async function addCoreJournalEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { error: auth.error };
  const student = await myDPStudent(auth.user.id);
  if ("error" in student) return { error: student.error };

  const element = String(formData.get("element") ?? "") as IBCoreElement;
  if (element !== "EE" && element !== "TOK") return { error: "Invalid element." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Write an entry before submitting." };

  const title = String(formData.get("title") ?? "").trim() || undefined;
  const kind = element === "EE" ? "MILESTONE" : "REFLECTION";

  const record = await prisma.iBCoreRecord.upsert({
    where: { studentId_element: { studentId: student.id, element } },
    create: { studentId: student.id, element, title, status: "IN_PROGRESS" },
    update: title ? { title } : {},
  });

  await prisma.iBCoreEntry.create({
    data: { coreRecordId: record.id, authorRole: "STUDENT", kind, text },
  });

  revalidatePath("/student/ib-core");
  revalidatePath("/teacher/ib-core");
  return { success: element === "EE" ? "Milestone added." : "Journal entry added." };
}
