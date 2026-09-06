"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { guard, ADMIN_ROLES } from "@/lib/authz";
import { DEMO_PASSWORD, generateTempPassword, hashPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";
import { FORCE_PASSWORD_RESET } from "@/lib/demo";
import type { ActionState } from "@/components/ui/form";

/**
 * Student registration.
 *
 * This used to collect nine fields — name, email, programme, date of birth,
 * two parent names, an occupation, an income and an address — while the student
 * profile screen has thirty-odd rows to render from them. A freshly registered
 * student therefore opened as a wall of em-dashes that only a second pass
 * through the profile editor could fill in. The office types the admission form
 * once; this is where it should land.
 *
 * Every column written here already exists on `Student` — the profile editor
 * writes the same ones — so none of this needs a migration. The three values the
 * profile shows that are deliberately NOT inputs stay derived: Age comes from
 * date of birth, Class and Grade from the assigned classroom, and the IB 1–7
 * average from the subject records a teacher enters later.
 */

const FLASH_COOKIE = "newStudentLogin";
const FLASH_PATH = "/admin/students/register";

const VALID_CURRICULA = ["PYP", "MYP", "DP"];

/** Trimmed form value, or null — an empty box must not store an empty string. */
function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function emailField(formData: FormData, key: string): string | null {
  return str(formData, key)?.toLowerCase() ?? null;
}

function dateField(formData: FormData, key: string): Date | null {
  const raw = str(formData, key);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * The next admission number in the school's own series.
 *
 * The register runs STU-26-1000 upwards and the profile screen prints it as the
 * Admission Number, so the office reads it out loud. The previous code wrote
 * `STU-<epoch ms>` — unique, unreadable, and sorting nowhere near the rest of
 * the roll. This continues the series for the current year instead, and the
 * office can still type its own.
 */
async function nextRegistrationNo(): Promise<string> {
  const yy = String(new Date().getFullYear() % 100).padStart(2, "0");
  const prefix = `STU-${yy}-`;
  const rows = await prisma.student.findMany({
    where: { registrationNo: { startsWith: prefix } },
    select: { registrationNo: true },
  });
  const highest = rows.reduce((max, r) => {
    const n = Number(r.registrationNo.slice(prefix.length));
    return Number.isFinite(n) && n > max ? n : max;
  }, 999);
  return `${prefix}${highest + 1}`;
}

/** Suggested to the form so the office sees the number before it commits. */
export async function suggestRegistrationNo(): Promise<string> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return "";
  return nextRegistrationNo();
}

export async function registerStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Creates a Student AND up to two logins. Must be an authorised office action.
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const name = str(formData, "name");
  if (!name) return { error: "The student's full name is required." };

  const curriculum = (str(formData, "curriculum") ?? "MYP").toUpperCase();
  if (!VALID_CURRICULA.includes(curriculum)) {
    return { error: "Choose an IB programme: PYP, MYP or DP." };
  }

  const studentEmail = emailField(formData, "email");
  const guardianEmail = emailField(formData, "guardianEmail");
  if (studentEmail && guardianEmail && studentEmail === guardianEmail) {
    return { error: "The student and the guardian cannot share one login address." };
  }

  // Checked before anything is created. Letting Prisma raise the unique-constraint
  // error instead surfaces as a 500 on a form the office uses every week, and can
  // leave a User row behind with no Student attached to it.
  if (studentEmail) {
    const taken = await prisma.user.findUnique({ where: { email: studentEmail }, select: { id: true } });
    if (taken) return { error: `That student email is already in use: ${studentEmail}` };
  }

  let registrationNo = str(formData, "registrationNo");
  if (registrationNo) {
    const taken = await prisma.student.findUnique({ where: { registrationNo }, select: { id: true } });
    if (taken) return { error: `Admission number ${registrationNo} already belongs to another student.` };
  } else {
    registrationNo = await nextRegistrationNo();
  }

  // A class is optional at the desk — a student can be enrolled before the
  // section is settled — but a class that does not exist is a typo, not a choice.
  const classroomId = str(formData, "classroomId");
  if (classroomId) {
    const room = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { id: true } });
    if (!room) return { error: "That class no longer exists. Reload the page and choose again." };
  }

  const guardianName = str(formData, "guardianName");
  const guardianPhone = str(formData, "guardianPhone");
  const wantsGuardian = Boolean(guardianEmail || guardianName || guardianPhone);

  // Hashing is deliberately memory-hard and therefore slow, so it happens before
  // the transaction opens rather than holding a connection open while it runs.
  const studentTemp = FORCE_PASSWORD_RESET ? generateTempPassword() : DEMO_PASSWORD;
  const guardianTemp = FORCE_PASSWORD_RESET ? generateTempPassword() : DEMO_PASSWORD;
  const studentHash = studentEmail ? await hashPassword(studentTemp) : null;
  const guardianHash = wantsGuardian ? await hashPassword(guardianTemp) : null;

  const admissionDate = dateField(formData, "admissionDate");
  const address = str(formData, "address");

  const issued: {
    studentEmail?: string;
    studentPassword?: string;
    guardianEmail?: string;
    guardianPassword?: string;
  } = {};
  let studentId: string;

  try {
    studentId = await prisma.$transaction(async (tx) => {
      let studentUserId: string | undefined;
      if (studentEmail) {
        const u = await tx.user.create({
          data: {
            name,
            email: studentEmail,
            password: studentHash!,
            mustChangePassword: FORCE_PASSWORD_RESET,
            role: "STUDENT",
          },
        });
        studentUserId = u.id;
        issued.studentEmail = studentEmail;
        issued.studentPassword = studentTemp;
      }

      // Guardian Name and Guardian Contact Number on the profile screen are read
      // off the linked Parent account, not off the Student row — which is why a
      // student registered without one shows a dash there forever, however
      // carefully the office filled the rest in. Reuse an existing parent when
      // the address already belongs to one, so a second child does not mint a
      // second account for the same family.
      let parentId: string | undefined;
      if (wantsGuardian) {
        const existingUser = guardianEmail
          ? await tx.user.findUnique({ where: { email: guardianEmail }, include: { parentProfile: true } })
          : null;

        if (existingUser?.parentProfile) {
          parentId = existingUser.parentProfile.id;
          if (guardianPhone && !existingUser.parentProfile.phone) {
            await tx.parent.update({ where: { id: parentId }, data: { phone: guardianPhone } });
          }
        } else if (existingUser) {
          const p = await tx.parent.create({ data: { userId: existingUser.id, phone: guardianPhone } });
          parentId = p.id;
        } else {
          const addr = guardianEmail ?? `parent.${registrationNo!.toLowerCase()}@edusphere.com`;
          const created = await tx.user.create({
            data: {
              name: guardianName ?? `${name}'s Parent`,
              email: addr,
              password: guardianHash!,
              mustChangePassword: FORCE_PASSWORD_RESET,
              role: "PARENT",
              parentProfile: { create: { phone: guardianPhone, address } },
            },
            include: { parentProfile: true },
          });
          parentId = created.parentProfile!.id;
          issued.guardianEmail = addr;
          issued.guardianPassword = guardianTemp;
        }
      }

      const student = await tx.student.create({
        data: {
          registrationNo: registrationNo!,
          name,
          curriculum,
          classroomId: classroomId ?? undefined,
          userId: studentUserId,
          parentId,

          // Personal
          dateOfBirth: dateField(formData, "dateOfBirth"),
          gender: str(formData, "gender"),
          section: str(formData, "section"),
          rollNumber: str(formData, "rollNumber"),
          academicYear: str(formData, "academicYear"),

          // Contact
          phone: str(formData, "phone"),
          address,
          city: str(formData, "city"),
          state: str(formData, "state"),
          country: str(formData, "country"),

          // Parent details that live on the student record itself
          fatherName: str(formData, "fatherName"),
          fatherPhone: str(formData, "fatherPhone"),
          fatherEmail: emailField(formData, "fatherEmail"),
          motherName: str(formData, "motherName"),
          motherPhone: str(formData, "motherPhone"),
          motherEmail: emailField(formData, "motherEmail"),
          motherOccupation: str(formData, "motherOccupation"),
          motherMonthlyIncome: str(formData, "motherMonthlyIncome"),
          emergencyContactName: str(formData, "emergencyContactName"),
          emergencyContactPhone: str(formData, "emergencyContactPhone"),

          // Academic. enrollmentDate is what the profile prints as Admission
          // Date; it defaults to now(), so only override it when the office
          // typed something — back-dating an admission is a real thing they do.
          previousSchool: str(formData, "previousSchool"),
          ...(admissionDate ? { enrollmentDate: admissionDate } : {}),

          // Health & support
          bloodGroup: str(formData, "bloodGroup"),
          allergies: str(formData, "allergies"),
          learningNeeds: str(formData, "learningNeeds"),
        },
        select: { id: true },
      });

      return student.id;
    });
  } catch (e) {
    // Two clerks registering at once can land on the same auto number between
    // the read above and this write. Say so plainly instead of throwing a 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That admission number or email was taken a moment ago. Submit again and a fresh number will be used." };
    }
    console.error("[registerStudent]", e);
    return { error: "Could not register the student. Nothing was saved. Please try again." };
  }

  await recordAudit({
    action: "ACCOUNT_CREATED",
    summary: `${auth.user.name ?? "An administrator"} registered ${name} (${registrationNo})${
      studentEmail ? ` with a portal login (${studentEmail})` : " without a portal login"
    }.`,
    actor: auth.user,
    entity: "Student",
    entityId: studentId,
    detail: {
      via: "registerStudent",
      registrationNo,
      portalLogin: Boolean(studentEmail),
      guardianLogin: Boolean(issued.guardianEmail),
      classAssigned: Boolean(classroomId),
    },
  });

  // The one-time passwords have to survive one round trip to reach the person
  // who will hand them over, and must not travel in the URL — a query string
  // ends up in browser history, in the next request's referrer, and in every
  // access log between here and the office. A short-lived httpOnly cookie,
  // cleared by the page that reads it, keeps them to this one render.
  if (FORCE_PASSWORD_RESET && (issued.studentPassword || issued.guardianPassword)) {
    const jar = await cookies();
    jar.set(
      FLASH_COOKIE,
      JSON.stringify({
        name,
        registrationNo,
        student: issued.studentEmail ? { email: issued.studentEmail, password: issued.studentPassword } : null,
        guardian: issued.guardianEmail ? { email: issued.guardianEmail, password: issued.guardianPassword } : null,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: FLASH_PATH,
        maxAge: 300,
      },
    );
  }

  revalidatePath("/admin/students/register");
  revalidatePath("/admin/students/registry");
  revalidatePath(`/admin/students/registry/${studentId}`);
  revalidatePath("/admin/users");

  return {
    success: `${name} registered as ${registrationNo}. The full profile is in the Student Registry.`,
  };
}

/**
 * Clears the one-time password banner.
 *
 * A Server Component can read cookies but not write them, so the page cannot
 * clear the flash itself. It expires on its own after five minutes; this gives
 * the office a way to say "written down" and have it gone immediately, which
 * matters when the next parent is standing at the desk.
 */
export async function dismissNewLogin(): Promise<void> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return;
  const jar = await cookies();
  jar.set(FLASH_COOKIE, "", { path: FLASH_PATH, maxAge: 0 });
  revalidatePath("/admin/students/register");
}
