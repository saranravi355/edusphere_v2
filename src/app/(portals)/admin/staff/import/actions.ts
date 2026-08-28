"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ImportRow, ImportResult } from "@/lib/bulkImport";
import { cleanValue } from "@/lib/bulkImport";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";

/*
 * Imported accounts used to share the constant "password123". A bulk import is
 * the worst place for a shared password: forty accounts created in one click,
 * all opening with a string printed on the login form. Each row now gets its
 * own one-time password, reported back in that row's import message so the
 * office can hand it over, and every one of them is refused after first use.
 */

const VALID_ROLES = ["CLASS_TEACHER", "SUBJECT_TEACHER"];

export async function importStaff(rows: ImportRow[]): Promise<ImportResult> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) {
    return { created: 0, skipped: 0, failed: 0, messages: [{ row: 0, status: "failed", detail: "Not authorised." }] };
  }

  const result: ImportResult = { created: 0, skipped: 0, failed: 0, messages: [] };

  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const takenEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNo = i + 1;

    const name = cleanValue(raw.name);
    const email = cleanValue(raw.email)?.toLowerCase();

    if (!name) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: "Missing name." });
      continue;
    }
    if (!email) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: "Missing email." });
      continue;
    }
    if (takenEmails.has(email)) {
      result.skipped++;
      result.messages.push({ row: rowNo, status: "skipped", detail: `Email already exists: ${email}.` });
      continue;
    }

    let role = (cleanValue(raw.role) || "SUBJECT_TEACHER").toUpperCase();
    if (!VALID_ROLES.includes(role)) role = "SUBJECT_TEACHER";

    const years = cleanValue(raw.yearsExperience);
    const cpd = cleanValue(raw.cpdHours);

    try {
      const tempPassword = generateTempPassword();
      const created = await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(tempPassword),
          mustChangePassword: true,
          role,
          teacherProfile: {
            create: {
              subjects: cleanValue(raw.subjects) ?? "",
              qualifications: cleanValue(raw.qualifications) ?? null,
              yearsExperience: years && !isNaN(Number(years)) ? Math.round(Number(years)) : null,
              cpdHours: cpd && !isNaN(Number(cpd)) ? Math.round(Number(cpd)) : 0,
            },
          },
        },
      });
      takenEmails.add(email);
      result.created++;
      result.messages.push({
        row: rowNo,
        status: "created",
        detail: `${name} added (${role.replace("_", " ").toLowerCase()}). One-time password: ${tempPassword}`,
      });
      await recordAudit({
        action: "ACCOUNT_CREATED",
        summary: `${session.user.name ?? "An administrator"} created a staff account for ${name} (${email}) by import.`,
        actor: { id: session.user.id, email: session.user.email, role: session.user.role },
        entity: "User",
        entityId: created.id,
        detail: { role, via: "importStaff" },
      });
    } catch (e) {
      result.failed++;
      result.messages.push({ row: rowNo, status: "failed", detail: e instanceof Error ? e.message : "Unknown error." });
    }
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/users");
  return result;
}
