-- Remove the assessment results that are dated in the future.
--
-- THE FAULT
--
-- An AssessmentResult is a grade a student has been given. 1,230 of the 2,509
-- on file -- 49%, for 101 students -- carried a date after the day this was
-- written (10 September 2026), running to 20 January 2027. They are a Term 1
-- assessment calendar that was filled in with grades ahead of time: "Formative
-- check" results for the rest of September, a "Half-term assessment" in October
-- for every subject record, and a mock, an IA draft and a Term 2 quiz for one
-- student. No code in the repository generates them any more, so there is no
-- source that would put them back.
--
-- WHY IT MATTERS
--
-- Every screen that reads results treats them as things that have happened.
-- The teacher's student profile sorts newest first, so its "Recent
-- assessments" led with October grades in September; report cards, subject
-- pages and the gradebook averaged them in; the AI analysis preview drew a
-- trend through months that had not arrived.
--
-- WHAT THIS DOES
--
-- Copies every result dated after the moment it runs into
-- AssessmentResult_future_dated_backup, then deletes those rows. `now()` rather
-- than a fixed date is deliberate: if this deploys after some of the dates have
-- passed, those results have become real and stay.
--
-- Results linked to an AI-grader submission are excluded outright. Those are
-- created when a teacher publishes a graded paper and are real whatever their
-- date. (None is dated in the future today.)
--
-- Every one of the 157 active students still has at least one result dated
-- before today afterwards, so no report card or subject page goes empty.
--
-- RESTORING
--
-- As the dates pass, rows can be put back from the backup:
--
--   INSERT INTO "AssessmentResult"
--     (id, "studentId", "subjectName", title, type, date, grade, "maxGrade", comment, term)
--   SELECT id, "studentId", "subjectName", title, type, date, grade, "maxGrade", comment, term
--   FROM "AssessmentResult_future_dated_backup"
--   WHERE date <= now()
--   ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS "AssessmentResult_future_dated_backup" AS
SELECT a.*, now() AS "backedUpAt"
FROM "AssessmentResult" a
WHERE a.date > now()
  AND NOT EXISTS (SELECT 1 FROM "AIGradingSubmission" g WHERE g."assessmentResultId" = a.id);

-- The backup holds student grades; keep it out of reach of the public API the
-- same way the application tables are.
ALTER TABLE "AssessmentResult_future_dated_backup" ENABLE ROW LEVEL SECURITY;

DELETE FROM "AssessmentResult" a
WHERE a.date > now()
  AND NOT EXISTS (SELECT 1 FROM "AIGradingSubmission" g WHERE g."assessmentResultId" = a.id);
