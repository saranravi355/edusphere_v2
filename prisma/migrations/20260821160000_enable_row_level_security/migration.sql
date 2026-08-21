-- Enable row level security on every table in the public schema.
--
-- WHY THIS EXISTS
--
-- Supabase publishes the public schema through PostgREST, reachable with the
-- anon "publishable" key. That key is public by design — it ships in client
-- code and is displayed in the dashboard. The only thing standing between it
-- and the data is row level security. With RLS off and no policies, anon can
-- SELECT, INSERT, UPDATE and DELETE every row: password hashes in User, medical
-- records in ClinicVisit, every child's record in Student.
--
-- `prisma migrate deploy` creates tables without RLS, so any database built
-- from these migrations comes up exposed. The original project had it switched
-- on by hand, outside version control, which meant the setting did not travel
-- when the database was moved to a new region — the copy carried the rows, and
-- silently left the protection behind.
--
-- WHY IT DOES NOT BREAK THE APP
--
-- The application connects as the table owner, and a table owner bypasses RLS
-- unless FORCE ROW LEVEL SECURITY is also set. It is not set here, deliberately.
-- So every Prisma query behaves exactly as before; only the PostgREST path is
-- closed. Enabling RLS with zero policies is a complete block, not a filter.
--
-- IF YOU ADD A TABLE LATER
--
-- A migration runs once, so a table created by a later migration will not be
-- covered. Either enable RLS in that migration, or re-run this block. It is
-- written to be idempotent: it only touches tables that do not already have it.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;
