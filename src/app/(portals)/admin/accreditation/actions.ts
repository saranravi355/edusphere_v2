"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { ADMIN_ROLES, STAFF_ROLES, guard } from "@/lib/authz";
import { classroomIdsForTeacher } from "@/lib/teacherScope";
import { columnFor } from "@/lib/accreditation/source";
import { practiceByKey, type EvidenceKind } from "@/lib/accreditation/standards";

/**
 * Tagging, confirming and the document register.
 *
 * This file is imported by five screens across three portals. That is
 * cosmetic: as lib/authz.ts says, every "use server" function is an
 * independently addressable HTTP endpoint reachable with any session or none,
 * regardless of which page imports it. The guards below are the whole defence.
 */

const DOCUMENT_KINDS = ["POLICY", "MINUTES", "HANDBOOK", "PLAN", "REPORT"];

/** Paths whose cached output changes when any tag changes. */
function revalidateEvidence() {
  revalidatePath("/admin/accreditation");
  revalidatePath("/visitor");
}

/**
 * Whether this caller may tag this particular record.
 *
 * A role check alone is not enough. Without the ownership half, any teacher
 * could tag any other teacher's lesson plan, or any of the 173 children's
 * portfolio items, by posting an id — the same hole ownPlan() closes in the
 * planner's own actions.
 */
async function mayTag(
  user: { id: string; role: string },
  kind: EvidenceKind,
  recordId: string,
): Promise<boolean> {
  if ((ADMIN_ROLES as readonly string[]).includes(user.role)) return true;

  // Documents are the coordinator's register; a teacher has no business
  // tagging one even though they may tag their own classroom records.
  if (kind === "DOCUMENT") return false;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!teacher) return false;

  if (kind === "LESSON_PLAN") {
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: recordId },
      select: { teacherId: true },
    });
    return plan?.teacherId === teacher.id;
  }

  if (kind === "OBSERVATION") {
    // Observations are written about a teacher by an observer. A teacher
    // tagging their own observation as evidence of their own practice is the
    // self-assessment the confirm step exists to catch, so it is refused
    // outright rather than queued.
    return false;
  }

  // Portfolio items and assessment results belong to a student, so the test is
  // whether this teacher teaches that student — the same rule the teacher's
  // student profile applies.
  const classroomIds = await classroomIdsForTeacher(user.id);
  if (classroomIds.length === 0) return false;

  const studentId =
    kind === "PORTFOLIO_ITEM"
      ? (await prisma.portfolioItem.findUnique({
          where: { id: recordId },
          select: { studentId: true },
        }))?.studentId
      : (await prisma.assessmentResult.findUnique({
          where: { id: recordId },
          select: { studentId: true },
        }))?.studentId;

  if (!studentId) return false;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classroomId: true },
  });
  return !!student?.classroomId && classroomIds.includes(student.classroomId);
}

export async function tagEvidence(input: {
  kind: EvidenceKind;
  recordId: string;
  standardKey: string;
  note?: string;
}) {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  // An unknown key would write a tag that no practice ever reads, so it would
  // vanish from the dashboard and reappear only in orphanKeys.
  if (!practiceByKey(input.standardKey)) return { error: "Unknown IB practice." };

  if (!(await mayTag(auth.user, input.kind, input.recordId))) {
    return { error: "That record is not yours to tag." };
  }

  // An administrator's tag is born confirmed: there is nobody above them to
  // confirm it, and asking them to confirm their own is theatre.
  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(auth.user.role);

  try {
    await prisma.evidenceTag.create({
      data: {
        standardKey: input.standardKey,
        status: isAdmin ? "CONFIRMED" : "SUGGESTED",
        note: input.note?.trim() || null,
        taggedById: auth.user.id,
        ...(isAdmin ? { confirmedById: auth.user.id, confirmedAt: new Date() } : {}),
        [columnFor(input.kind)]: input.recordId,
      },
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    // P2002: the unique index caught a second tag for the same record and
    // practice. P2003: the record id does not exist, which happens when
    // somebody deletes a lesson plan in another tab and then clicks here.
    if (code === "P2002") return { error: "That is already tagged against this practice." };
    if (code === "P2003") return { error: "That record no longer exists." };
    throw e;
  }

  revalidateEvidence();
  return { success: true as const };
}

export async function confirmTag(tagId: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const tag = await prisma.evidenceTag.findUnique({
    where: { id: tagId },
    select: { status: true },
  });
  if (!tag) return { error: "That tag no longer exists." };

  // Idempotent on purpose. Two coordinators working the queue at once would
  // otherwise show the second one a failure for work that succeeded.
  if (tag.status === "CONFIRMED") return { success: true as const };

  await prisma.evidenceTag.update({
    where: { id: tagId },
    data: { status: "CONFIRMED", confirmedById: auth.user.id, confirmedAt: new Date() },
  });

  revalidateEvidence();
  return { success: true as const };
}

export async function rejectTag(tagId: string) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const tag = await prisma.evidenceTag.findUnique({
    where: { id: tagId },
    select: { status: true },
  });
  if (!tag) return { error: "That tag no longer exists." };
  if (tag.status === "REJECTED") return { success: true as const };

  await prisma.evidenceTag.update({
    where: { id: tagId },
    data: { status: "REJECTED", confirmedById: auth.user.id, confirmedAt: new Date() },
  });

  revalidateEvidence();
  return { success: true as const };
}

export async function uploadEvidenceDocument(formData: FormData) {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const title = (formData.get("title") as string)?.trim();
  const kind = formData.get("kind") as string;
  const file = formData.get("file") as File | null;

  if (!title) return { error: "A title is required." };
  if (!DOCUMENT_KINDS.includes(kind)) return { error: "Unknown document kind." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };

  // Upload first, insert second. The other order leaves the register listing a
  // document whose link is dead whenever the upload fails.
  const blob = await put(`accreditation/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const reviewedOn = formData.get("reviewedOn") as string;
  const created = await prisma.evidenceDocument.create({
    data: {
      title,
      kind,
      description: (formData.get("description") as string)?.trim() || null,
      fileUrl: blob.url,
      fileType: file.type || null,
      academicYear: (formData.get("academicYear") as string) || null,
      reviewedOn: reviewedOn ? new Date(reviewedOn) : null,
      uploadedById: auth.user.id,
    },
    select: { id: true },
  });

  revalidateEvidence();
  return { success: true as const, id: created.id };
}
