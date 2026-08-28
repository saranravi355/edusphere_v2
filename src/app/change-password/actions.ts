"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { getSession, issueSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { landingPathFor } from "@/lib/portals";

export type ChangePasswordState = { error?: string } | undefined;

/**
 * Changing your own password.
 *
 * The current password is required even though the caller is already signed
 * in. A session cookie on an unattended laptop is not the same evidence as
 * knowing the password, and this is the one action that decides who can sign
 * in tomorrow.
 */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next || !confirm) {
    return { error: "Please fill in all three fields." };
  }
  if (next !== confirm) {
    return { error: "The two new passwords do not match." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: session.user.id } });
  } catch (e) {
    console.error("[changePassword] database lookup failed:", e);
    return { error: "Cannot reach the database right now. Please try again in a moment." };
  }
  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { valid } = await verifyPassword(current, user.password);
  if (!valid) {
    await recordAudit({
      action: "SIGN_IN_FAILED",
      summary: `${user.name} gave the wrong current password while trying to change it.`,
      actor: { id: user.id, email: user.email, role: user.role },
      entity: "User",
      entityId: user.id,
    });
    return { error: "That is not your current password." };
  }

  if (next === current) {
    return { error: "The new password is the same as the old one." };
  }

  const problem = passwordProblem(next, { email: user.email, name: user.name });
  if (problem) return { error: problem };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(next),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("[changePassword] could not save:", e);
    return { error: "Could not save the new password. Please try again." };
  }

  // The old cookie still says mustChangePassword, and the middleware believes
  // it. Re-issue before redirecting or the person bounces straight back here.
  await issueSession({ ...user, mustChangePassword: false });

  await recordAudit({
    action: "PASSWORD_CHANGED",
    summary: `${user.name} changed their own password.`,
    actor: { id: user.id, email: user.email, role: user.role },
    entity: "User",
    entityId: user.id,
    detail: { firstTime: user.passwordChangedAt === null },
  });

  redirect(landingPathFor(user.role));
}
