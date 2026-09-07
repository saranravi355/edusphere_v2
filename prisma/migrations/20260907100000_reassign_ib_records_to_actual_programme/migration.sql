-- Put 41 students' IB subject records into the programme they are actually in.
--
-- THE FAULT
--
-- 246 of the 606 IBSubjectRecord rows carried a level from the wrong programme.
-- 35 MYP students held a full DP subject load — Aarohi Saxena in MYP4A was
-- recorded as taking Biology HL, Chemistry HL, English A: Literature HL,
-- Business Management SL, French B SL and Maths AI SL — and 6 DP students held
-- MYP records instead. It is a seeding fault: the subject sets were handed out
-- without regard to each student's programme.
--
-- It is not cosmetic. Those rows are read by the student profile, the report
-- card, the programmes dashboards and the DP predicted-grade analysis, which
-- has been averaging MYP students into a diploma statistic.
--
-- WHAT MAKES IT MORE THAN A LEVEL SWAP
--
-- Every affected student holds exactly 6 rows and no student mixes the two
-- kinds, so each one is a clean whole-set replacement. But two things stop a
-- straight rename:
--
--   * 13 of the DP rows collide by group. A student holding Biology HL and
--     Chemistry HL has two group 4 subjects, and both would become "Sciences" —
--     two rows for one subject in one term.
--   * The 6 DP students hold MYP sets that cannot become a diploma. Aarav Verma
--     has no group 1 and no group 5 subject at all, and holds Design and
--     Physical & Health Education, which have no DP equivalent.
--
-- So each student's rows are ranked and assigned from an ordered target list.
-- Both lists run in group order, so in the ordinary case a group 4 subject
-- lands on the group 4 subject; where a student has two in one group the second
-- shifts into the next free slot rather than colliding. Every student ends with
-- 6 distinct subjects, and every DP student ends with exactly one subject from
-- each of groups 1 to 6 — a valid diploma, which several of them did not have.
--
-- WHAT IS NOT CARRIED ACROSS
--
-- currentGrade moves, because 1-7 means the same thing in both programmes.
--
-- predictedGrade is cleared. A predicted grade is a DP instrument — it is what a
-- university offer hangs off — and the school's own 198 correct MYP rows carry
-- none. Going the other way it is cleared too rather than invented: a predicted
-- grade is a teacher's professional judgement, not something a migration is
-- entitled to make up.
--
-- The MYP criteria are cleared on rows that become DP, because criteria are
-- MYP's. They are left null on rows that become MYP rather than fabricated.
--
-- teacherComment is cleared on every remapped row. The comments are about
-- specific subject content — "Prototype iteration shows real ATL growth" was
-- written about Design — and carrying that onto English A would be worse than
-- an empty field. Teachers can re-enter them from Grading -> IB Subject Records.
--
-- subjectGroup follows the school's existing convention rather than the
-- textbook one: its 198 correct MYP rows sit under group 1, so the MYP targets
-- below do too. Filing these differently would split each subject in two on the
-- Analytics grade-by-group chart. The DP groups are already correct in the data
-- and are used as they stand.
--
-- REVERSIBILITY
--
-- Every affected row is copied to IBSubjectRecord_wrong_programme_backup first,
-- whole and unmodified, so this can be undone from the backup table alone.

-- ---------------------------------------------------------------------------
-- 0. Snapshot every row this migration is about to touch
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "IBSubjectRecord_wrong_programme_backup" AS
SELECT r.*, now() AS "backedUpAt"
  FROM "IBSubjectRecord" r
  JOIN "Student" s ON s.id = r."studentId"
 WHERE (s.curriculum = 'MYP' AND r.level IN ('HL', 'SL'))
    OR (s.curriculum = 'DP'  AND r.level = 'MYP');

-- ---------------------------------------------------------------------------
-- 1. MYP students holding DP records  ->  the MYP subject set
-- ---------------------------------------------------------------------------
--
-- Eight targets for six rows: the two spare slots absorb the group collisions.

WITH targets (slot, subject_name, subject_group) AS (
  VALUES
    (1, 'Language & Literature',          1),
    (2, 'Language Acquisition: Spanish',  1),
    (3, 'Individuals & Societies',        1),
    (4, 'Sciences',                       1),
    (5, 'Mathematics',                    1),
    (6, 'Arts',                           1),
    (7, 'Design',                         1),
    (8, 'Physical & Health Education',    1)
),
ranked AS (
  SELECT r.id,
         row_number() OVER (
           PARTITION BY r."studentId"
           ORDER BY r."subjectGroup", r."subjectName"
         ) AS slot
    FROM "IBSubjectRecord" r
    JOIN "Student" s ON s.id = r."studentId"
   WHERE s.curriculum = 'MYP' AND r.level IN ('HL', 'SL')
)
UPDATE "IBSubjectRecord" r
   SET "subjectName"    = t.subject_name,
       "subjectGroup"   = t.subject_group,
       level            = 'MYP',
       "predictedGrade" = NULL,
       "teacherComment" = NULL
  FROM ranked k
  JOIN targets t ON t.slot = k.slot
 WHERE r.id = k.id;

-- ---------------------------------------------------------------------------
-- 2. DP students holding MYP records  ->  a valid six-subject diploma
-- ---------------------------------------------------------------------------
--
-- Exactly six targets, one per group, at the levels the school's own DP rows
-- already use. Source rows are ranked in the school's MYP subject order so the
-- correspondence is stable and the humanities land on humanities.

WITH targets (slot, subject_name, subject_group, subject_level) AS (
  VALUES
    (1, 'English A: Language & Literature',   1, 'SL'),
    (2, 'Spanish B',                          2, 'SL'),
    (3, 'Economics',                          3, 'HL'),
    (4, 'Physics',                            4, 'HL'),
    (5, 'Mathematics: Analysis & Approaches', 5, 'HL'),
    (6, 'Visual Arts',                        6, 'SL')
),
ranked AS (
  SELECT r.id,
         row_number() OVER (
           PARTITION BY r."studentId"
           ORDER BY array_position(
             ARRAY['Language & Literature',
                   'Language Acquisition: Spanish',
                   'Individuals & Societies',
                   'Sciences',
                   'Mathematics',
                   'Arts',
                   'Design',
                   'Physical & Health Education'],
             r."subjectName"
           ), r."subjectName"
         ) AS slot
    FROM "IBSubjectRecord" r
    JOIN "Student" s ON s.id = r."studentId"
   WHERE s.curriculum = 'DP' AND r.level = 'MYP'
)
UPDATE "IBSubjectRecord" r
   SET "subjectName"    = t.subject_name,
       "subjectGroup"   = t.subject_group,
       level            = t.subject_level,
       "critA"          = NULL,
       "critB"          = NULL,
       "critC"          = NULL,
       "critD"          = NULL,
       "predictedGrade" = NULL,
       "teacherComment" = NULL
  FROM ranked k
  JOIN targets t ON t.slot = k.slot
 WHERE r.id = k.id;
