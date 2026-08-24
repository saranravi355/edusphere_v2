-- Operations manager accounts.
--
-- Canteen, transport, hostel, resources and assets used to be reachable only
-- through the admin portal, so the only way to let the canteen supervisor edit
-- next week's menu was to make them an administrator — handing them payroll,
-- staff appraisals and every student record along with it.
--
-- These five accounts each run exactly one department through /operations.
-- Roles are plain strings in this schema (there is no Postgres enum to extend),
-- so nothing else has to change for them to exist. lib/operations.ts is the
-- single source of truth mapping role to URL slug.
--
-- PASSWORDS
--
-- Seeded as the same well-known "password123" every other sample account
-- started with. That is a placeholder, not a decision: login re-hashes a
-- plaintext password with scrypt the first time the account signs in, and
-- scripts/hash-passwords.mjs drains the column ahead of that. Deliberately no
-- hash is committed here — a salted hash in a git history is still a hash in a
-- git history, and this file is public to anyone who can read the repository.
--
-- Change these before real staff use them. See 6.5 of the build document.
--
-- Idempotent: re-running adds nothing, and it will not clobber a password that
-- has already been changed or hashed.

INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES
  ('ops_canteen_mgr',   'canteen@edusphere.com',   'password123', 'Canteen Manager',   'CANTEEN_MANAGER',   NOW(), NOW()),
  ('ops_transport_mgr', 'transport@edusphere.com', 'password123', 'Transport Manager', 'TRANSPORT_MANAGER', NOW(), NOW()),
  ('ops_hostel_mgr',    'hostel@edusphere.com',    'password123', 'Hostel Warden',     'HOSTEL_MANAGER',    NOW(), NOW()),
  ('ops_resources_mgr', 'resources@edusphere.com', 'password123', 'Resources Manager', 'RESOURCES_MANAGER', NOW(), NOW()),
  ('ops_assets_mgr',    'assets@edusphere.com',    'password123', 'Assets Manager',    'ASSETS_MANAGER',    NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
