import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserPlus } from "lucide-react";
import { DEMO_PASSWORD, generateTempPassword, hashPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";
import { cookies } from "next/headers";
import { FORCE_PASSWORD_RESET } from "@/lib/demo";
import { guard, ADMIN_ROLES } from "@/lib/authz";

async function registerStudent(formData: FormData) {
  "use server";
  // Creates a Student AND a login. Must be an authorised office action.
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) redirect("/");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const curriculum = (formData.get("curriculum") as string) || "MYP";
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const fatherName = formData.get("fatherName") as string;
  const motherName = formData.get("motherName") as string;
  const motherOccupation = formData.get("motherOccupation") as string;
  const motherMonthlyIncome = formData.get("motherIncome") as string;
  const address = formData.get("address") as string;

  // Was `hashPassword("changeme123")` for every student the office registered.
  // In demo mode it is the shared password like every other account; with
  // FORCE_PASSWORD_RESET set it is one per student, shown once on this page.
  const tempPassword = FORCE_PASSWORD_RESET ? generateTempPassword() : DEMO_PASSWORD;

  const user = email
    ? await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(tempPassword),
          mustChangePassword: FORCE_PASSWORD_RESET,
          role: "STUDENT",
        }
      })
    : null;

  await prisma.student.create({
    data: {
      registrationNo: `STU-${Date.now()}`,
      name,
      curriculum,
      userId: user?.id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      fatherName,
      motherName,
      motherOccupation,
      motherMonthlyIncome,
      address,
    }
  });

  await recordAudit({
    action: "ACCOUNT_CREATED",
    summary: `${auth.user.name ?? "An administrator"} registered ${name}${email ? ` with a portal login (${email})` : " without a portal login"}.`,
    actor: auth.user,
    entity: "Student",
    entityId: null,
    detail: { via: "registerStudent", portalLogin: Boolean(email) },
  });

  // The one-time password has to survive one redirect to reach the person who
  // will hand it over, and it must not travel in the URL — a query string ends
  // up in browser history, in the referrer of the next request, and in every
  // access log between here and the office. A short-lived httpOnly cookie,
  // cleared by the page that reads it, keeps it to this one render.
  if (user && FORCE_PASSWORD_RESET) {
    const jar = await cookies();
    jar.set("newStudentLogin", `${email}|${tempPassword}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin/students/register",
      maxAge: 300,
    });
  }

  revalidatePath("/admin/students/register");
  revalidatePath("/admin/users");
}

/**
 * Clears the one-time password banner.
 *
 * A Server Component can read cookies but not write them, so the page cannot
 * clear the flash itself. It expires on its own after five minutes; this gives
 * the office a way to say "written down" and have it gone immediately, which
 * matters when the next parent is standing at the desk.
 */
async function dismissNewLogin() {
  "use server";
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) redirect("/");
  const jar = await cookies();
  jar.set("newStudentLogin", "", { path: "/admin/students/register", maxAge: 0 });
  revalidatePath("/admin/students/register");
}

export const dynamic = "force-dynamic";

export default async function RegisterStudentPage() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }

  // Set by the action above, read once, and gone on the next render. Shown as
  // a banner rather than a toast because the office has to copy it onto
  // something before navigating away.
  const jar = await cookies();
  const flash = jar.get("newStudentLogin")?.value;
  const [newEmail, newPassword] = flash ? flash.split("|") : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Register New Student"
        description="Add a new student record and create their portal account."
      />

      {newPassword && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5"
        >
          <p className="font-bold text-amber-900 dark:text-amber-200">
            Account created. Write this down now.
          </p>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mt-1">
            It is shown only on this screen and cannot be looked up again.
          </p>
          <dl className="mt-3 text-sm font-mono bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/50 p-3 space-y-1">
            <div className="flex gap-2">
              <dt className="text-slate-500 w-24 shrink-0">Email</dt>
              <dd className="text-slate-900 dark:text-slate-100 break-all">{newEmail}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500 w-24 shrink-0">Password</dt>
              <dd className="text-slate-900 dark:text-slate-100 tracking-wider">{newPassword}</dd>
            </div>
          </dl>
          <p className="text-xs text-amber-900/70 dark:text-amber-200/70 mt-3">
            The student will be asked to choose their own password the first
            time they sign in. This one stops working then.
          </p>
          <form action={dismissNewLogin} className="mt-4">
            <button
              type="submit"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-100 transition-colors"
            >
              I have written it down — hide this
            </button>
          </form>
        </div>
      )}

      <form action={registerStudent} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
            <input required name="name" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
            <input required name="email" type="email" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">IB Programme</label>
            <select required name="curriculum" defaultValue="MYP" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500">
              <option value="PYP">PYP (Primary Years Programme)</option>
              <option value="MYP">MYP (Middle Years Programme)</option>
              <option value="DP">DP (Diploma Programme)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
            <input required name="dateOfBirth" type="date" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        <h3 className="font-bold text-slate-800 dark:text-slate-200">Guardian Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Father&apos;s Name</label>
            <input name="fatherName" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Name</label>
            <input name="motherName" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Occupation</label>
            <input name="motherOccupation" type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother&apos;s Monthly Income</label>
            <input name="motherIncome" type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Address</label>
          <textarea name="address" rows={3} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 resize-none" />
        </div>

        <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm">
          <UserPlus size={16} /> Register Student
        </button>
      </form>
    </div>
  );
}
