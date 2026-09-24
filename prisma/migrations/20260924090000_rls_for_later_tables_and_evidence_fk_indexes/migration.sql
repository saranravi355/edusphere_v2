-- The same miss as 20260907090000, a third time: tables created after the last
-- RLS sweep came up with RLS off, and the accreditation tables arrived with
-- unindexed foreign keys. Supabase's linter flags 14 tables at ERROR level.

-- ---------------------------------------------------------------------------
-- 1. Row level security on every public table that still lacks it
-- ---------------------------------------------------------------------------
--
-- QueryTicket, QueryTicketMessage, TeacherFeedback, PortfolioItem, IBCoreEntry,
-- LearnerProfileEvidence, ATLSkillRecord, ProgressReport, MarkingScheme,
-- EvidenceTag, EvidenceDocument, and the four *_backup tables left by earlier
-- data migrations. With RLS off, PostgREST serves all of them - student
-- reports, portfolios, parent tickets - to anyone holding the anon key.
--
-- Unchanged from the earlier sweeps: idempotent, and invisible to the app,
-- which connects as the table owner (RLS without FORCE does not apply to it).

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
-- 2. Covering indexes for the accreditation tables' foreign keys
-- ---------------------------------------------------------------------------
--
-- EvidenceTag's @@unique pairs all lead with standardKey, so none of them
-- covers a lookup by the source record alone - and every DELETE of a lesson
-- plan, portfolio item, result, observation or document scans EvidenceTag to
-- cascade.

CREATE INDEX IF NOT EXISTS "EvidenceTag_taggedById_idx" ON "EvidenceTag"("taggedById");
CREATE INDEX IF NOT EXISTS "EvidenceTag_confirmedById_idx" ON "EvidenceTag"("confirmedById");
CREATE INDEX IF NOT EXISTS "EvidenceTag_lessonPlanId_idx" ON "EvidenceTag"("lessonPlanId");
CREATE INDEX IF NOT EXISTS "EvidenceTag_portfolioItemId_idx" ON "EvidenceTag"("portfolioItemId");
CREATE INDEX IF NOT EXISTS "EvidenceTag_assessmentResultId_idx" ON "EvidenceTag"("assessmentResultId");
CREATE INDEX IF NOT EXISTS "EvidenceTag_observationId_idx" ON "EvidenceTag"("observationId");
CREATE INDEX IF NOT EXISTS "EvidenceTag_documentId_idx" ON "EvidenceTag"("documentId");
CREATE INDEX IF NOT EXISTS "EvidenceDocument_uploadedById_idx" ON "EvidenceDocument"("uploadedById");
