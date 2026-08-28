import prisma from "@/lib/prisma";

/**
 * The audit trail.
 *
 * Two rules, both deliberate:
 *
 * 1. **It never throws.** An audit write failing must not fail the sign-in,
 *    the password change or the account creation it was recording. A logging
 *    call that can take down the thing it observes gets removed by the next
 *    person debugging an outage, and then there is no trail at all.
 *
 * 2. **It never records a secret.** No password, no hash, no session token, no
 *    cookie. The log is the thing most likely to be exported, mailed to an
 *    inspector, or pasted into a support ticket.
 */

export type AuditAction =
  | "SIGN_IN"
  | "SIGN_IN_FAILED"
  | "SIGN_OUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ACCOUNT_CREATED"
  | "ROLE_CHANGED"
  | "ACCOUNT_DISABLED";

export type AuditActor = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
} | null;

export async function recordAudit(input: {
  action: AuditAction;
  summary: string;
  actor?: AuditActor;
  entity?: string;
  entityId?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        summary: input.summary,
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        actorRole: input.actor?.role ?? null,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        detail: input.detail ? JSON.stringify(input.detail) : null,
      },
    });
  } catch (e) {
    // Last resort: at least the server log has it.
    console.error("[audit] could not record", input.action, e);
  }
}
