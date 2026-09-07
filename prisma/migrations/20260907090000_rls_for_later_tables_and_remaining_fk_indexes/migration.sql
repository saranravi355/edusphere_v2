-- Two tables came up without row level security, and four foreign keys without
-- an index. Both are the same kind of miss: a rule applied once to everything
-- that existed at the time, and then not applied to what arrived afterwards.

-- ---------------------------------------------------------------------------
-- 1. Row level security on the tables added since 20260821160000
-- ---------------------------------------------------------------------------
--
-- That migration enabled RLS on every table in the public schema and said, in
-- as many words: "A migration runs once, so a table created by a later
-- migration will not be covered. Either enable RLS in that migration, or
-- re-run this block."
--
-- Two later migrations did neither. AIGradingSubmission (20260902131552) and
-- AuditLog (20260828100000) have been sitting in the public schema with RLS
-- off, which means PostgREST would serve them to anyone holding the anon key —
-- a key that is public by design and ships in client code. AuditLog holds the
-- sign-in record, email addresses included. Supabase's own linter flags both
-- at ERROR level.
--
-- This is the same block, re-run. It is idempotent: it only touches tables that
-- do not already have RLS, so running it again later costs nothing and is the
-- cheapest way to close this gap whenever it reopens.
--
-- It does not change how the application behaves. The app connects as the table
-- owner, and an owner bypasses RLS unless FORCE ROW LEVEL SECURITY is also set,
-- which it deliberately is not. The 59 tables already covered are the proof:
-- they have had RLS on with zero policies since August and every Prisma query
-- against them still works. Only the PostgREST path closes.

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

-- ---------------------------------------------------------------------------
-- 2. The four foreign keys left without a covering index
-- ---------------------------------------------------------------------------
--
-- 20260906120000 indexed the foreign keys the application filters and joins on,
-- and deliberately skipped a handful judged not worth the write cost. Supabase's
-- performance linter disagrees about these four, and it has the better argument:
-- an unindexed foreign key also makes every DELETE on the parent scan this table
-- to find its children. Quizzes and timetable entries are small today, but the
-- cost of the index is smaller.

CREATE INDEX IF NOT EXISTS "Quiz_subjectId_idx" ON "Quiz"("subjectId");
CREATE INDEX IF NOT EXISTS "Quiz_moderatedByTeacherId_idx" ON "Quiz"("moderatedByTeacherId");
CREATE INDEX IF NOT EXISTS "QuizResponse_questionId_idx" ON "QuizResponse"("questionId");
CREATE INDEX IF NOT EXISTS "TimetableEntry_subjectId_idx" ON "TimetableEntry"("subjectId");
