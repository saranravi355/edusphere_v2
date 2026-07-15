"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type ImportStudentRow = {
  name?: string;
  registrationNo?: string;
  email?: string;
  curriculum?: string;
  classroom?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  nationality?: string;
  motherTongue?: string;
  fatherName?: string;
  motherName?: string;
  motherOccupation?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
};

export type ImportResult = {
  created: number;
  skipped: number;
  failed: number;
  messages: { row: number; status: "created" | "skipped" | "failed"; detail: string }[];
};

const VALID_CURRICULA = ["PYP", "MYP", "DP"];

function clean(v: string | undefined | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const t = String(v).trim();
  return t.length ? t : undefined;
}

export async function importStudents(rows: ImportStudentRow[]): Promise<ImportResult> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) {
    return { created: 0, skipped: 0, failed: 0, messages: [{ row: 0, status: "failed", detail: "Not authorised." }] };
  }

  const result: ImportResult = { created: 0, skipped: 0, failed: 0, messages: [] };

  // Preload lookups for dedupe + classroom resolution.
  const [classrooms, existingStudents, existingUsers] = await Promise.all([
    prisma.classroom.findMany({ select: { id: true, name: true } }),
    prisma.student.findMany({ select: { registrationNo: true } }),
    prisma.user.findMany({ select: { email: true } }),
  ]);

  const classByName = new Map(classrooms.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const takenRegNos = new Set(existingStudents.map((s) => s.registrationNo.toLowerCase()));
  const takenEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNo = i + 1;

    const name = clean(raw.name);
    const curriculum = clean(raw.curriculum)?.toUpperCase();

    // Hard validation — skip rows that can't produce a valid student.
    if (!name) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: "Missing name." });
      continue;
    }
    if (!curriculum || !VALID_CURRICULA.includes(curriculum)) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: `Invalid IB programme "${raw.curriculum ?? ""}" (must be PYP, MYP or DP).` });
      continue;
    }

    const email = clean(raw.email)?.toLowerCase();
    if (email && takenEmails.has(email)) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: `Student email already exists: ${email}.` });
      continue;
    }

    let registrationNo = clean(raw.registrationNo);
    if (registrationNo && takenRegNos.has(registrationNo.toLowerCase())) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: `Registration number already exists: ${registrationNo}.` });
      continue;
    }
    if (!registrationNo) {
      registrationNo = `STU-${Date.now()}-${rowNo}`;
    }

    // Resolve classroom by name (optional).
    let classroomId: string | undefined;
    const classroomName = clean(raw.classroom);
    if (classroomName) {
      classroomId = classByName.get(classroomName.toLowerCase());
      if (!classroomId) {
        result.skipped++;
        result.messages.push({ row: rowNo, status: "skipped", detail: `Unknown class/section "${classroomName}".` });
        continue;
      }
    }

    // Parse DOB leniently (accepts ISO or DD/MM/YYYY).
    let dateOfBirth: Date | undefined;
    const dobRaw = clean(raw.dateOfBirth);
    if (dobRaw) {
      let d = new Date(dobRaw);
      if (isNaN(d.getTime())) {
        const m = dobRaw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
        if (m) d = new Date(Number(m[3].length === 2 ? "20" + m[3] : m[3]), Number(m[2]) - 1, Number(m[1]));
      }
      if (!isNaN(d.getTime())) dateOfBirth = d;
    }

    const parentName = clean(raw.parentName);
    const parentEmailRaw = clean(raw.parentEmail)?.toLowerCase();
    const parentPhone = clean(raw.parentPhone);

    try {
      await prisma.$transaction(async (tx) => {
        // Student portal login (optional).
        let studentUserId: string | undefined;
        if (email) {
          const u = await tx.user.create({
            data: { name, email, password: "password123", role: "STUDENT" },
          });
          studentUserId = u.id;
        }

        // Parent — reuse existing parent by email, else create if any parent info present.
        let parentId: string | undefined;
        if (parentEmailRaw || parentName || parentPhone) {
          let parentUser = parentEmailRaw
            ? await tx.user.findUnique({ where: { email: parentEmailRaw }, include: { parentProfile: true } })
            : null;

          if (parentUser?.parentProfile) {
            parentId = parentUser.parentProfile.id;
          } else if (parentUser) {
            const p = await tx.parent.create({ data: { userId: parentUser.id, phone: parentPhone } });
            parentId = p.id;
          } else {
            const pEmail = parentEmailRaw ?? `parent.${registrationNo!.toLowerCase()}@edusphere.com`;
            parentUser = await tx.user.create({
              data: { name: parentName ?? `${name}'s Parent`, email: pEmail, password: "password123", role: "PARENT", parentProfile: { create: { phone: parentPhone } } },
              include: { parentProfile: true },
            });
            parentId = parentUser.parentProfile!.id;
          }
        }

        await tx.student.create({
          data: {
            registrationNo: registrationNo!,
            name,
            curriculum,
            classroomId,
            userId: studentUserId,
            parentId,
            gender: clean(raw.gender),
            dateOfBirth,
            bloodGroup: clean(raw.bloodGroup),
            address: clean(raw.address),
            nationality: clean(raw.nationality),
            motherTongue: clean(raw.motherTongue),
            fatherName: clean(raw.fatherName),
            motherName: clean(raw.motherName),
            motherOccupation: clean(raw.motherOccupation),
          },
        });
      });

      // Reserve identifiers so later rows in the same batch don't collide.
      takenRegNos.add(registrationNo.toLowerCase());
      if (email) takenEmails.add(email);
      if (parentEmailRaw) takenEmails.add(parentEmailRaw);

      result.created++;
      result.messages.push({ row: rowNo, status: "created", detail: `${name} (${registrationNo}) enrolled.` });
    } catch (e) {
      result.failed++;
      result.messages.push({ row: rowNo, status: "failed", detail: e instanceof Error ? e.message : "Unknown error." });
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/students/registry");
  revalidatePath("/admin/users");
  return result;
}
