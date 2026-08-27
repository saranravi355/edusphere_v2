/**
 * Make each student's programme and age agree with the year group they are in.
 *
 *   node scripts/fix-cohorts.mjs --dry-run   # report what is wrong, change nothing
 *   node scripts/fix-cohorts.mjs             # fix it
 *
 * THE DEFECT
 *
 * Three fields on Student that have to agree did not agree with each other,
 * because the original seed generated them independently:
 *
 *   - `curriculum` was random. 56 students were marked PYP while sitting in
 *     MYP and DP classrooms — four of them in DP2A, which is grade 12. The
 *     school's own dashboard reported a 56-strong PYP cohort that had no
 *     classes, no year groups and no teachers.
 *   - `dateOfBirth` was random inside a narrow band. Every student, in every
 *     grade, was between 13 and 16. Grade 6 and grade 12 had the same average
 *     age, 14.8. A grade 12 student born in 2012 is 14 years old.
 *   - `classroomId` → `gradeLevel` is the one field with real structure:
 *     fifteen classrooms, twenty-two students in each, grades 6 to 12.
 *
 * So the year group is treated as the truth and the other two are derived from
 * it. This is not cosmetic: anything age-aware or programme-aware — IB subject
 * records, the programme dashboards, safeguarding, an eventual PYP — reads
 * these fields and would have been reading noise.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not invent a PYP cohort. There are no primary classrooms and no
 * primary-age children, so after this runs the school is honestly an MYP and DP
 * school. PYPUnit stays empty until real primary students enrol; seeding units
 * of inquiry against a cohort that does not exist would make the dashboard look
 * right while the data underneath stayed false, which is the exact failure the
 * August audit spent 81 screens removing.
 *
 * IDEMPOTENT, AND IT KEEPS CORRECTIONS
 *
 * Ages are anchored to a fixed academic-year start rather than today, so a
 * second run computes the same dates rather than sliding everyone forward. And
 * a row is only touched when it is actually wrong: a date of birth already
 * within a year of the right age for its grade is somebody's real correction
 * and is left alone.
 */
import { PrismaClient } from "@prisma/client";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

/**
 * 1 June 2026 — the start of the academic year these year groups belong to.
 * A child in grade G is G+5 on that date. Fixed rather than `now()` so the
 * script is stable across runs.
 */
const YEAR_START = "2026-06-01";

/** IB programme by year group. PYP 1–5, MYP 6–10, DP 11–12. */
const PROGRAMME_SQL = `CASE WHEN c."gradeLevel" <= 5 THEN 'PYP'
                            WHEN c."gradeLevel" <= 10 THEN 'MYP'
                            ELSE 'DP' END`;

log(DRY ? "DRY RUN — nothing will be written.\n" : "Aligning programme and age to year group.\n");
function log(...a) { console.log(...a); }

/* ------------------------------------------------------------- inspection -- */

const before = await prisma.$queryRawUnsafe(`
  SELECT count(*)::int AS students,
         count(*) FILTER (WHERE s.curriculum <> ${PROGRAMME_SQL})::int AS wrong_programme,
         count(*) FILTER (WHERE s."dateOfBirth" IS NULL
            OR date_part('year', age(DATE '${YEAR_START}', s."dateOfBirth"))
               NOT BETWEEN c."gradeLevel" + 4 AND c."gradeLevel" + 6)::int AS wrong_age
  FROM "Student" s JOIN "Classroom" c ON c.id = s."classroomId"
  WHERE s."isActive"
`);
log(`Enrolled students: ${before[0].students}`);
log(`  programme disagrees with year group: ${before[0].wrong_programme}`);
log(`  age disagrees with year group:       ${before[0].wrong_age}\n`);

/* --------------------------------------------------------------- the fix -- */

/**
 * Birthdays are spread evenly across the twelve months that produce the right
 * age, ordered by registration number, so a year group looks like a year group
 * rather than sharing one birthday.
 */
const AGE_FIX = `
  WITH ranked AS (
    SELECT s.id, c."gradeLevel" AS g, s."dateOfBirth" AS dob,
           row_number() OVER (PARTITION BY c."gradeLevel" ORDER BY s."registrationNo") - 1 AS idx,
           count(*)     OVER (PARTITION BY c."gradeLevel")                                 AS n
    FROM "Student" s JOIN "Classroom" c ON c.id = s."classroomId"
    WHERE s."isActive"
  )
  UPDATE "Student" s
  SET "dateOfBirth" = (DATE '${YEAR_START}'
        - ((r.g + 6) * INTERVAL '1 year') + INTERVAL '1 day'
        + (r.idx * (365.0 / r.n)) * INTERVAL '1 day')::timestamp(3)
  FROM ranked r
  WHERE s.id = r.id
    AND (r.dob IS NULL
         OR date_part('year', age(DATE '${YEAR_START}', r.dob)) NOT BETWEEN r.g + 4 AND r.g + 6)
`;

const PROGRAMME_FIX = `
  UPDATE "Student" s
  SET curriculum = ${PROGRAMME_SQL}
  FROM "Classroom" c
  WHERE c.id = s."classroomId" AND s."isActive" AND s.curriculum <> ${PROGRAMME_SQL}
`;

/**
 * The sixteen leavers have no classroom to derive from, so their year of
 * graduation stands in: a DP graduate is eighteen when they finish.
 */
const ALUMNI_AGE_FIX = `
  WITH ranked AS (
    SELECT s.id, a."graduationYear" AS gy, s."dateOfBirth" AS dob,
           row_number() OVER (PARTITION BY a."graduationYear" ORDER BY s."registrationNo") - 1 AS idx,
           count(*)     OVER (PARTITION BY a."graduationYear")                                 AS n
    FROM "Student" s JOIN "Alumni" a ON a."studentId" = s.id
    WHERE NOT s."isActive"
  )
  UPDATE "Student" s
  SET "dateOfBirth" = (make_date(r.gy, 6, 1)
        - INTERVAL '19 years' + INTERVAL '1 day'
        + (r.idx * (365.0 / r.n)) * INTERVAL '1 day')::timestamp(3)
  FROM ranked r
  WHERE s.id = r.id
    AND (r.dob IS NULL
         OR date_part('year', age(make_date(r.gy, 6, 1), r.dob)) NOT BETWEEN 17 AND 19)
`;

if (DRY) {
  log("Nothing was written. Re-run without --dry-run to apply.");
} else {
  const programme = await prisma.$executeRawUnsafe(PROGRAMME_FIX);
  const ages = await prisma.$executeRawUnsafe(AGE_FIX);
  const alumni = await prisma.$executeRawUnsafe(ALUMNI_AGE_FIX);
  log(`Programme corrected: ${programme}`);
  log(`Ages corrected:      ${ages} enrolled, ${alumni} leavers`);

  const after = await prisma.$queryRawUnsafe(`
    SELECT ${PROGRAMME_SQL} AS programme, c."gradeLevel" AS grade, count(*)::int AS students,
           min(date_part('year', age(DATE '${YEAR_START}', s."dateOfBirth")))::int AS youngest,
           max(date_part('year', age(DATE '${YEAR_START}', s."dateOfBirth")))::int AS oldest
    FROM "Student" s JOIN "Classroom" c ON c.id = s."classroomId"
    WHERE s."isActive"
    GROUP BY 1, 2 ORDER BY 2
  `);
  log("\n  Programme  Grade  Students  Age");
  for (const r of after) {
    log(`  ${r.programme.padEnd(9)}  ${String(r.grade).padStart(5)}  ${String(r.students).padStart(8)}  ${r.youngest === r.oldest ? r.youngest : `${r.youngest}–${r.oldest}`}`);
  }
}

await prisma.$disconnect();
