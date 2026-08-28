-- Close the password gate, and start keeping a record.
--
-- Before this migration every one of the 370 accounts held a scrypt hash of the
-- string "password123". Hashing had closed the leaked-backup hole, but the
-- plaintext was identical for every account, it was printed as the default
-- value of the login form's password field, and the application contained no
-- screen on which anybody could change it. A hash of a password everyone knows
-- is not a secret.
--
-- This migration does three things:
--   1. removes the column default, so a row created without a password can no
--      longer receive "password123" silently;
--   2. flags every existing account as needing a password of its own, which
--      the new /change-password screen lets them set on next sign-in;
--   3. adds the audit table, because the system could not previously say who
--      had changed a role, written off a fee, or created an account.
--
-- Safe to re-run: every statement is guarded.

-- 1. The default.
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;

-- 2. The reset flags.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- Existing rows took the DEFAULT above, so they are already flagged. Stated
-- explicitly anyway: if this migration is ever re-run against a database where
-- the column was added by hand with a different default, the intent still holds.
UPDATE "User" SET "mustChangePassword" = true WHERE "passwordChangedAt" IS NULL;

-- 3. The audit table.
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "detail" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_at_idx" ON "AuditLog"("at");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_at_idx" ON "AuditLog"("actorId", "at");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_at_idx" ON "AuditLog"("action", "at");

-- A marker so the log itself records the moment the gate closed.
INSERT INTO "AuditLog" ("id", "action", "summary", "detail")
SELECT
  'audit-genesis-20260828',
  'PASSWORD_RESET',
  'Every existing account was required to choose a new password. Until now all accounts shared the seeded password and no screen existed to change it.',
  json_build_object('accountsFlagged', (SELECT count(*) FROM "User"))::text
WHERE NOT EXISTS (SELECT 1 FROM "AuditLog" WHERE "id" = 'audit-genesis-20260828');
