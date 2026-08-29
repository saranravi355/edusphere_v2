-- Demo mode: stop forcing a password change.
--
-- The previous migration required all 370 accounts to choose a password of
-- their own. That is the right behaviour for a school with real families in
-- the database and the wrong one for a demonstration, where the point is that
-- anyone can sign in as any role with the shared password and look around.
--
-- The machinery is not removed, only switched off. Setting
-- NEXT_PUBLIC_FORCE_PASSWORD_RESET=true in the environment turns it back on
-- for every account created from then on; to re-flag the accounts that already
-- exist, run:
--
--   UPDATE "User" SET "mustChangePassword" = true WHERE "passwordChangedAt" IS NULL;
--
-- The password column still has no default — a row created without a password
-- must still fail rather than silently receive a known one — and the audit
-- table stays.

ALTER TABLE "User" ALTER COLUMN "mustChangePassword" SET DEFAULT false;

-- Nobody has chosen their own password yet, so nobody is mid-reset; clearing
-- the flag outright is safe. The condition keeps anyone who has since set one.
UPDATE "User" SET "mustChangePassword" = false WHERE "passwordChangedAt" IS NULL;

INSERT INTO "AuditLog" ("id", "action", "summary", "detail")
SELECT
  'audit-demo-mode-20260828',
  'PASSWORD_RESET',
  'Forced password reset switched off: this deployment is a demonstration and every account keeps the shared password on purpose.',
  json_build_object('accountsCleared', (SELECT count(*) FROM "User"))::text
WHERE NOT EXISTS (SELECT 1 FROM "AuditLog" WHERE "id" = 'audit-demo-mode-20260828');
