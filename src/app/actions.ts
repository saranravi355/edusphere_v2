"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSession, issueSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { landingPathFor } from "@/lib/portals";

export type LoginState = { error?: string } | undefined;

/**
 * Signature matches React's `useActionState`, so the login page can render
 * whatever this returns. The previous version was invoked as
 * `action={async (fd) => { await login(fd) }}`, which threw the result away —
 * every failure looked identical to nothing happening at all.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  // Normalise: addresses are stored lower-case, and mobile keyboards happily
  // auto-capitalise the first letter, which previously failed the lookup.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    // A database outage must not look like a wrong password.
    console.error("[login] database lookup failed:", e);
    return { error: "Cannot reach the database right now. Please try again in a moment." };
  }

  // Always run the verify, even when the user does not exist, so a missing
  // account and a wrong password take a similar amount of time.
  const { valid, needsUpgrade } = await verifyPassword(
    password,
    user?.password ?? "$never$matches$",
  );
  if (!user || !valid) {
    await recordAudit({
      action: "SIGN_IN_FAILED",
      summary: `Failed sign-in for ${email}.`,
      actor: { email },
      entity: "User",
      entityId: user?.id ?? null,
      detail: { reason: user ? "wrong password" : "no such account" },
    });
    return { error: "Invalid email or password." };
  }

  if (needsUpgrade) {
    // Seeded plaintext: replace it with a hash now that we know it is correct.
    try {
      await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
    } catch (e) {
      console.error("[login] could not upgrade stored password:", e);
    }
  }

  await issueSession(user);

  await recordAudit({
    action: "SIGN_IN",
    summary: `${user.name} signed in as ${user.role}.`,
    actor: { id: user.id, email: user.email, role: user.role },
    entity: "User",
    entityId: user.id,
  });

  // redirect() signals via a thrown control-flow error, so it must stay outside
  // the try/catch above.

  // An account that has never had a password of its own goes nowhere else.
  // The seeded accounts all shared one password and there was no screen on
  // which to change it; this is that screen, and the middleware refuses every
  // portal until the flag clears.
  if (user.mustChangePassword) {
    redirect("/change-password");
  }
  redirect(landingPathFor(user.role));
}

export async function logout() {
  const session = await getSession();
  if (session?.user) {
    await recordAudit({
      action: "SIGN_OUT",
      summary: `${session.user.name} signed out.`,
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      entity: "User",
      entityId: session.user.id,
    });
  }
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  redirect("/");
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/", "layout");
}
