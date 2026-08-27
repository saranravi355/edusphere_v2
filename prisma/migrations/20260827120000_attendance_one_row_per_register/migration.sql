-- One register mark per student, per session, per day.
--
-- The table had no unique constraint at all beyond its primary key, and three
-- separate call sites each did their own find-then-create before writing. They
-- disagreed: one computed "today" from the SERVER's midnight rather than
-- Bengaluru's, matched an open-ended `date >= today` with no upper bound, and
-- ignored `session` entirely. So a child could be marked PRESENT and ABSENT on
-- the same morning, and two of them were, on 18 and 19 June 2026.
--
-- This migration makes that state unrepresentable. It is written to be safe on
-- any copy of the database — production, a restore, or a fresh local fixture —
-- so the cleanup travels with the constraint instead of being a thing someone
-- remembered to run first.

-- 1. Give every row a canonical date.
--    Marks were stored as the instant the button was pressed, so the same
--    school day held 08:15 from a bulk seed, 00:00 from a term backfill and
--    whatever o'clock a teacher tapped. Truncating to the day makes "one row
--    per register" expressible at all. Every existing time sits well before
--    18:30 UTC, so no row moves to a different IST school day.
UPDATE "Attendance"
   SET date = date_trunc('day', date)
 WHERE date <> date_trunc('day', date);

-- 2. Collapse the duplicates that normalising now exposes.
--    The most recently created row wins: where the two disagree, the later one
--    is the correction a person made through the app, and the earlier is the
--    bulk-seeded mark it was correcting. Ties break on id so the result is
--    deterministic rather than dependent on scan order.
DELETE FROM "Attendance" a
      USING "Attendance" b
      WHERE a."studentId" = b."studentId"
        AND a.date        = b.date
        AND a.session     = b.session
        AND (a."createdAt" < b."createdAt"
             OR (a."createdAt" = b."createdAt" AND a.id < b.id));

-- 3. Now it cannot happen again.
CREATE UNIQUE INDEX "Attendance_studentId_date_session_key"
    ON "Attendance"("studentId", date, session);
