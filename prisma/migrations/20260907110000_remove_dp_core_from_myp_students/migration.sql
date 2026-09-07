-- Take TOK, EE and CAS off the 35 MYP students who were given them.
--
-- THE FAULT
--
-- The same programme fault that 20260907100000 fixed in IBSubjectRecord, in a
-- second table. 105 IBCoreRecord rows — TOK, EE and CAS, three each for 35 MYP
-- students — record Diploma Programme core against students who are not in the
-- Diploma Programme. TOK, EE and CAS are DP; an MYP student does the Personal
-- Project and Service as Action instead.
--
-- WHY IT MATTERS RATHER THAN JUST BEING UNTIDY
--
-- The rows are invisible to the students themselves: /student/grades puts the
-- whole TOK/EE/CAS block behind `isDP`, so an MYP student has never seen the
-- theory-of-knowledge grade sitting on their record. Every screen that counts
-- rather than filters has been reading them:
--
--   * the CAS Tracker lists everyone with a CAS row — 35 of its 82 entries are
--     MYP students who are not doing CAS, so 43% of that screen is wrong;
--   * the IB Programmes dashboard builds its TOK and EE maps from all core
--     records, mixing MYP students into a DP completion figure;
--   * Analytics counts core records at A/B across the whole table;
--   * the admin student profile renders ibCore generically, so an MYP student's
--     profile shows a TOK grade — a fact about them that is not true.
--
-- WHY DELETE RATHER THAN CONVERT
--
-- The honest MYP equivalents are the Personal Project, the Community Project
-- and Service as Action. None of them is modelled: IBCoreRecord has no element
-- for them, and no screen in the application looks for one. Writing rows for
-- them would create data that nothing can display — the same fault this
-- codebase has just spent two changes removing, only fresh.
--
-- So the wrong records go, and MYP core stays unmodelled until somebody builds
-- it. An empty section is a smaller lie than a filled-in one that is wrong.
--
-- Nothing is invented and nothing is moved: only rows that should never have
-- existed are removed, and every one is copied out first.

-- ---------------------------------------------------------------------------
-- Snapshot, then delete
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "IBCoreRecord_myp_removed_backup" AS
SELECT c.*, now() AS "backedUpAt"
  FROM "IBCoreRecord" c
  JOIN "Student" s ON s.id = c."studentId"
 WHERE s.curriculum = 'MYP';

DELETE FROM "IBCoreRecord" c
 USING "Student" s
 WHERE s.id = c."studentId"
   AND s.curriculum = 'MYP';
