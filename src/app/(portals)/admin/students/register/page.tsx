import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import RegisterStudentClient, { type ClassOption } from "./RegisterStudentClient";
import { dismissNewLogin, suggestRegistrationNo } from "./actions";

export const dynamic = "force-dynamic";

/**
 * The Indian school year runs June to March, so "2026-27" means the year that
 * started in June 2026. Written as the same "YYYY-YY" string the fee schedule
 * already uses, so the two agree.
 */
function currentAcademicYear(now = new Date()): string {
  const y = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

type Flash = {
  name?: string;
  registrationNo?: string;
  student?: { email?: string; password?: string } | null;
  guardian?: { email?: string; password?: string } | null;
};

export default async function RegisterStudentPage() {
  const session = await getSession();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PRINCIPAL")) {
    redirect("/");
  }

  const [classes, suggested, jar] = await Promise.all([
    prisma.classroom.findMany({
      select: { id: true, name: true, gradeLevel: true },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    suggestRegistrationNo(),
    cookies(),
  ]);

  // Set by the action, read once, and gone on the next render. Shown as a
  // banner rather than a toast because the office has to copy it onto
  // something before navigating away.
  let flash: Flash | null = null;
  const raw = jar.get("newStudentLogin")?.value;
  if (raw) {
    try {
      flash = JSON.parse(raw) as Flash;
    } catch {
      flash = null;
    }
  }
  const credentials = [
    flash?.student?.password ? { who: "Student", ...flash.student } : null,
    flash?.guardian?.password ? { who: "Guardian", ...flash.guardian } : null,
  ].filter(Boolean) as { who: string; email?: string; password?: string }[];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Register New Student"
        description="Everything the student profile shows, captured once at admission."
      />

      {credentials.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-5"
        >
          <p className="font-bold text-amber-900 dark:text-amber-200">
            {flash?.name ? `${flash.name} registered` : "Account created"}
            {flash?.registrationNo ? ` as ${flash.registrationNo}` : ""}. Write this down now.
          </p>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mt-1">
            {credentials.length > 1 ? "These are shown" : "It is shown"} only on this screen and
            cannot be looked up again.
          </p>
          <dl className="mt-3 text-sm font-mono bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/50 p-3 space-y-3">
            {credentials.map((c) => (
              <div key={c.who} className="space-y-1">
                <p className="font-sans text-xs font-bold uppercase tracking-wide text-slate-500">
                  {c.who}
                </p>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-24 shrink-0">Email</dt>
                  <dd className="text-slate-900 dark:text-slate-100 break-all">{c.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-24 shrink-0">Password</dt>
                  <dd className="text-slate-900 dark:text-slate-100 tracking-wider">{c.password}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="text-xs text-amber-900/70 dark:text-amber-200/70 mt-3">
            Each holder is asked to choose their own password the first time they sign in. These
            stop working then.
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

      <RegisterStudentClient
        classes={classes as ClassOption[]}
        suggestedRegistrationNo={suggested}
        currentAcademicYear={currentAcademicYear()}
      />
    </div>
  );
}
