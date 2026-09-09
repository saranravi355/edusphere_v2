-- Make every MYP grade agree with the criteria it was marked from.
--
-- THE FAULT
--
-- A MYP grade is not a judgement a teacher makes alongside the criteria. It is
-- the IB's published conversion of them: four criteria out of 8, summed to a
-- total out of 32, read off one fixed table that is the same for every subject
-- group and every year.
--
--     0-5 -> 1    6-9 -> 2    10-14 -> 3    15-18 -> 4
--     19-23 -> 5    24-27 -> 6    28-32 -> 7
--
-- The grading screen asked for both halves as unconnected boxes. `critA`-`critD`
-- and `currentGrade` were saved as independent numbers, nothing derived one from
-- the other, and nothing compared them. So they drifted.
--
-- Of the 660 MYP records that carry all four criteria, 446 agree with the table
-- and 214 do not — very nearly a third.
--
-- WHY IT MATTERS RATHER THAN JUST BEING UNTIDY
--
-- The student report card prints the criterion total in one column and the
-- grade in the next, under a line saying the total was converted with the IB
-- grade boundary table. For 214 records that sentence is untrue on the page it
-- is printed on, and the two numbers next to each other are enough for a parent
-- to see it.
--
-- Everything downstream reads `currentGrade` and not the criteria: the MYP
-- averages on /admin/programmes, the subject breakdown, the student's own
-- grades page, the registry profile. All of them have been reporting the typed
-- number.
--
-- THE DIRECTION OF THE ERROR
--
-- Not random. 208 of the 214 are graded BELOW what their criteria support --
-- 200 by one band and 8 by two -- against only 6 above. Teachers were marking
-- the criteria honestly and then writing down a more conservative grade. Eight
-- students marked at 24 or 28 out of 32, which is a 6 and a 7, are recorded as
-- a 4 and a 5.
--
-- WHAT THIS DOES
--
-- Only rows where all four criteria are marked and the student is in the MYP.
-- A partial set is left exactly as it is: three criteria out of four convert to
-- a total one or two bands low, and rewriting a grade on the strength of
-- criteria nobody has finished marking would do real harm. `IBSubjectRecord`
-- rows for DP students are untouched -- a DP grade is awarded by examiners
-- against session-specific boundaries and is not computable from these columns.
--
-- The application no longer allows the two to diverge: src/lib/ib/mypGrade.ts
-- holds the table, the save action derives the grade from the criteria instead
-- of accepting a typed one, and the grading screen shows the conversion rather
-- than asking for it.
--
-- REVERSIBILITY
--
-- Every row about to change is copied first, with the grade it held, the
-- criteria it was marked with and the total they come to. Restoring is a join
-- on id against IBSubjectRecord_myp_grade_backup.

CREATE TABLE IF NOT EXISTS "IBSubjectRecord_myp_grade_backup" AS
SELECT
  r.id,
  r."studentId",
  r."subjectName",
  r.term,
  r."currentGrade"  AS "gradeBefore",
  r."critA", r."critB", r."critC", r."critD",
  (r."critA" + r."critB" + r."critC" + r."critD") AS "criterionTotal",
  now() AS "backedUpAt"
FROM "IBSubjectRecord" r
JOIN "Student" s ON s.id = r."studentId"
WHERE s.curriculum = 'MYP'
  AND r."critA" IS NOT NULL AND r."critB" IS NOT NULL
  AND r."critC" IS NOT NULL AND r."critD" IS NOT NULL
  AND r."currentGrade" IS DISTINCT FROM (
    CASE
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 5  THEN 1
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 9  THEN 2
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 14 THEN 3
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 18 THEN 4
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 23 THEN 5
      WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 27 THEN 6
      ELSE 7
    END
  );

UPDATE "IBSubjectRecord" r
SET "currentGrade" = CASE
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 5  THEN 1
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 9  THEN 2
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 14 THEN 3
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 18 THEN 4
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 23 THEN 5
  WHEN r."critA" + r."critB" + r."critC" + r."critD" <= 27 THEN 6
  ELSE 7
END
FROM "Student" s
WHERE s.id = r."studentId"
  AND s.curriculum = 'MYP'
  AND r."critA" IS NOT NULL AND r."critB" IS NOT NULL
  AND r."critC" IS NOT NULL AND r."critD" IS NOT NULL;
