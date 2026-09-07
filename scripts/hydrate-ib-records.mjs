/**
 * Fill the gaps in the IB academic record.
 *
 *   node scripts/hydrate-ib-records.mjs --dry-run   # print the plan, write nothing
 *   node scripts/hydrate-ib-records.mjs             # write it
 *
 * WHY THIS IS NOT THE SEED
 *
 * prisma/seed.ts cannot do this. Every bulk block in it is guarded by
 * `if (existingCount === 0)`, which is an all-or-nothing test against the whole
 * table: once one attendance row exists, the seed never writes another. So a
 * student added after the first seed run stays empty for ever, and re-running
 * the seed against this database does nothing at all.
 *
 * WHY THIS IS NOT A MIGRATION EITHER
 *
 * Because a migration would run itself. Every branch push triggers a Vercel
 * preview build, `npm run build` runs `prisma migrate deploy`, and it does so
 * with production credentials — so a migration reaches the live database at
 * `git push`, before review. That is acceptable for a schema change that has
 * been dry-run; it is not the right shape for a script that invents academic
 * data. This runs when somebody decides to run it.
 *
 * WHAT IT WILL NOT TOUCH
 *
 *   - Inactive students. 16 of the 173 are withdrawn, and they correctly have
 *     no attendance, no invoices and no subject records. Filling those in would
 *     be inventing a school career for somebody who left.
 *   - Any value a person or an earlier run already set. Every write is a gap
 *     fill: a null becomes a value, a value is never overwritten. Running it
 *     twice changes nothing the second time.
 *   - MYP students' TOK, EE and CAS rows. 35 of them hold DP core records,
 *     which is the same programme fault that 20260907100000 fixed in
 *     IBSubjectRecord — TOK, EE and CAS are Diploma Programme core, and MYP
 *     students do the Personal Project instead. Deleting a student's academic
 *     records is not a thing a hydration script should decide on its own, so it
 *     is reported here and left alone.
 *
 * WHAT IT FILLS
 *
 *   1. A six-subject set for active students who have none.
 *   2. TOK, EE and CAS for active DP students who have none.
 *   3. MYP criteria A-D where the row has a grade but no criteria.
 *   4. A DP predicted grade where the row has none.
 *   5. A teacher comment where the row has none.
 *   6. Assessment results for active students who have none.
 *
 * Everything generated is derived from the grade already on the record, so the
 * criteria, the predicted grade and the comment agree with it rather than
 * contradicting the number a teacher can see.
 */

import { PrismaClient } from "@prisma/client";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();
const TERM = "Term 1 2026-27";

const log = (...a) => console.log(...a);
log(DRY ? "DRY RUN — nothing will be written.\n" : "Hydrating the IB academic record.\n");

/**
 * Deterministic pseudo-randomness, keyed on the student id.
 *
 * A second run must make the same choices as the first, or a re-run would look
 * like the school had quietly re-taught the year. Nothing here uses Math.random.
 */
function seededInt(key, salt, min, max) {
  let h = 2166136261;
  const s = `${key}:${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return min + (Math.abs(h) % (max - min + 1));
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/* ------------------------------------------------------------- catalogues -- */

// The MYP set, filed under group 1 to match the school's existing rows. See the
// note in 20260907100000: filing a subject differently from the rows already
// there splits it in two on the Analytics grade-by-group chart.
const MYP_SET = [
  "Language & Literature",
  "Language Acquisition: Spanish",
  "Individuals & Societies",
  "Sciences",
  "Mathematics",
  "Arts",
].map((name) => ({ name, group: 1, level: "MYP" }));

// Two diploma shapes, both already present in the register. The second takes
// two group 4 sciences and no group 6 subject, which the IB permits and which
// six of the school's existing DP students are following.
const DP_SETS = [
  [
    { name: "English A: Language & Literature", group: 1, level: "SL" },
    { name: "Spanish B", group: 2, level: "SL" },
    { name: "Economics", group: 3, level: "HL" },
    { name: "Physics", group: 4, level: "HL" },
    { name: "Mathematics: Analysis & Approaches", group: 5, level: "HL" },
    { name: "Visual Arts", group: 6, level: "SL" },
  ],
  [
    { name: "English A: Literature", group: 1, level: "HL" },
    { name: "French B", group: 2, level: "SL" },
    { name: "Business Management", group: 3, level: "SL" },
    { name: "Biology", group: 4, level: "HL" },
    { name: "Chemistry", group: 4, level: "HL" },
    { name: "Mathematics: Applications & Interpretation", group: 5, level: "SL" },
  ],
];

/** Comments that describe the grade, so the words and the number agree. */
const COMMENT_BY_BAND = {
  high: [
    "Consistently strong analysis; keep pushing the evaluative writing.",
    "Excellent command of the material and a real independence of thought.",
    "Outstanding inquiry work — a model of the IB learner profile.",
    "Secure across every criterion; ready for the harder extension tasks.",
  ],
  mid: [
    "Solid understanding; the next step is justifying conclusions more fully.",
    "Good progress this term. Focus on time management in extended responses.",
    "Understands the content well; needs to show more of the working.",
    "Reliable work throughout. Push for more depth in the evaluation.",
  ],
  low: [
    "Finding the abstract material difficult; targeted support is in place.",
    "Attendance at the clinic sessions is making a difference — keep it up.",
    "Needs to secure the fundamentals before the next unit builds on them.",
    "Working hard; the gap is in applying the method to unfamiliar problems.",
  ],
};

function commentFor(key, subject, grade) {
  const band = grade >= 6 ? "high" : grade >= 4 ? "mid" : "low";
  const bank = COMMENT_BY_BAND[band];
  return bank[seededInt(key, `comment:${subject}`, 0, bank.length - 1)];
}

/** MYP criteria out of 8, scattered around the 1-7 grade they add up to. */
function criteriaFor(key, subject, grade) {
  const centre = clamp(Math.round((grade / 7) * 8), 1, 8);
  return {
    critA: clamp(centre + seededInt(key, `A${subject}`, -1, 1), 1, 8),
    critB: clamp(centre + seededInt(key, `B${subject}`, -1, 1), 1, 8),
    critC: clamp(centre + seededInt(key, `C${subject}`, -1, 1), 1, 8),
    critD: clamp(centre + seededInt(key, `D${subject}`, -1, 1), 1, 8),
  };
}

/** A predicted grade sits within a point of the current one, usually at or above. */
function predictedFor(key, subject, grade) {
  return clamp(grade + seededInt(key, `pred:${subject}`, 0, 1), 1, 7);
}

/* ------------------------------------------------------- 1. subject records -- */

const students = await prisma.student.findMany({
  where: { isActive: true },
  select: {
    id: true, name: true, curriculum: true,
    _count: { select: { ibSubjects: true, ibCore: true, assessmentResults: true } },
  },
  orderBy: { registrationNo: "asc" },
});

const needSubjects = students.filter((s) => s._count.ibSubjects === 0);
log(`Subject records: ${needSubjects.length} active students have none.`);

/**
 * What each student will have once step 1 is done.
 *
 * Step 6 grades against this rather than re-reading the table. On a real run
 * the two are the same; on a dry run the rows do not exist yet, and a dry run
 * that reported "0 assessments" because of its own dryness would be lying about
 * what the real run is going to do.
 */
const subjectsByStudent = new Map();

let subjectRowsMade = 0;
for (const s of needSubjects) {
  const set = s.curriculum === "DP"
    ? DP_SETS[seededInt(s.id, "dpset", 0, DP_SETS.length - 1)]
    : MYP_SET;

  for (const subj of set) {
    const grade = clamp(seededInt(s.id, `grade:${subj.name}`, 3, 7), 1, 7);
    const data = {
      studentId: s.id,
      subjectName: subj.name,
      subjectGroup: subj.group,
      level: subj.level,
      term: TERM,
      currentGrade: grade,
      teacherComment: commentFor(s.id, subj.name, grade),
      ...(s.curriculum === "DP"
        ? { predictedGrade: predictedFor(s.id, subj.name, grade) }
        : criteriaFor(s.id, subj.name, grade)),
    };
    if (!DRY) await prisma.iBSubjectRecord.create({ data });
    if (!subjectsByStudent.has(s.id)) subjectsByStudent.set(s.id, []);
    subjectsByStudent.get(s.id).push({ subjectName: subj.name, currentGrade: grade });
    subjectRowsMade++;
  }
}
log(`  → ${subjectRowsMade} subject records${DRY ? " would be" : ""} created.\n`);

/* ----------------------------------------------------------- 2. DP core -- */
//
// TOK, EE and CAS are Diploma Programme core. Only DP students get them here.

const needCore = students.filter((s) => s.curriculum === "DP" && s._count.ibCore === 0);
log(`DP core (TOK/EE/CAS): ${needCore.length} active DP students have none.`);

let coreRowsMade = 0;
for (const s of needCore) {
  const tok = String.fromCharCode(65 + seededInt(s.id, "tok", 0, 2));   // A-C
  const ee = String.fromCharCode(65 + seededInt(s.id, "ee", 0, 2));
  const rows = [
    { element: "TOK", status: "IN_PROGRESS", grade: tok },
    { element: "EE", status: seededInt(s.id, "eestatus", 0, 1) ? "SUBMITTED" : "IN_PROGRESS", grade: ee },
    { element: "CAS", status: "IN_PROGRESS", grade: null },
  ];
  for (const r of rows) {
    if (!DRY) await prisma.iBCoreRecord.create({ data: { studentId: s.id, ...r } });
    coreRowsMade++;
  }
}
log(`  → ${coreRowsMade} core records${DRY ? " would be" : ""} created.\n`);

/* ------------------------------------- 3-5. fill the holes in existing rows -- */

const existing = await prisma.iBSubjectRecord.findMany({
  select: {
    id: true, studentId: true, subjectName: true, currentGrade: true,
    predictedGrade: true, teacherComment: true, critA: true, level: true,
    student: { select: { curriculum: true, isActive: true } },
  },
});

let critFilled = 0, predFilled = 0, commentFilled = 0;
for (const r of existing) {
  if (!r.student.isActive) continue;
  const grade = r.currentGrade;
  if (grade === null) continue;

  const patch = {};

  // MYP marks four criteria; a DP row has none by design.
  if (r.student.curriculum === "MYP" && r.critA === null) {
    Object.assign(patch, criteriaFor(r.studentId, r.subjectName, grade));
    critFilled++;
  }
  if (r.student.curriculum === "DP" && r.predictedGrade === null) {
    patch.predictedGrade = predictedFor(r.studentId, r.subjectName, grade);
    predFilled++;
  }
  if (r.teacherComment === null) {
    patch.teacherComment = commentFor(r.studentId, r.subjectName, grade);
    commentFilled++;
  }

  if (Object.keys(patch).length && !DRY) {
    await prisma.iBSubjectRecord.update({ where: { id: r.id }, data: patch });
  }
}
log(`Existing rows: ${critFilled} MYP criteria sets, ${predFilled} predicted grades, ${commentFilled} comments${DRY ? " would be" : ""} filled.\n`);

/* ------------------------------------------------------ 6. assessments -- */

const needAssessments = students.filter((s) => s._count.assessmentResults === 0);
log(`Assessments: ${needAssessments.length} active students have none.`);

const ASSESSMENTS = [
  { title: "Formative Assessment 1", type: "FORMATIVE", daysAgo: 48 },
  { title: "Summative Assessment 1", type: "SUMMATIVE", daysAgo: 21 },
];

let assessmentRowsMade = 0;
for (const s of needAssessments) {
  // Grade against the subjects the student actually has, so the report card
  // and the subject list agree with one another. Step 1's own output is used
  // where it applies, so this is correct on a dry run too.
  const subjects = subjectsByStudent.get(s.id)
    ?? await prisma.iBSubjectRecord.findMany({
      where: { studentId: s.id },
      select: { subjectName: true, currentGrade: true },
    });
  for (const subj of subjects) {
    for (const a of ASSESSMENTS) {
      const base = subj.currentGrade ?? 5;
      const grade = clamp(base + seededInt(s.id, `${a.title}:${subj.subjectName}`, -1, 1), 1, 7);
      const date = new Date();
      date.setHours(9, 0, 0, 0);
      date.setDate(date.getDate() - a.daysAgo);
      if (!DRY) {
        await prisma.assessmentResult.create({
          data: {
            studentId: s.id,
            subjectName: subj.subjectName,
            title: a.title,
            type: a.type,
            date,
            grade,
            maxGrade: 7,
            term: TERM,
          },
        });
      }
      assessmentRowsMade++;
    }
  }
}
log(`  → ${assessmentRowsMade} assessment results${DRY ? " would be" : ""} created.\n`);

/* ------------------------------------------------------------- reported -- */

const mypCore = await prisma.iBCoreRecord.count({ where: { student: { curriculum: "MYP" } } });
if (mypCore > 0) {
  log(`NOT TOUCHED: ${mypCore} TOK/EE/CAS rows belong to MYP students.`);
  log(`  TOK, EE and CAS are Diploma Programme core; MYP students do the Personal`);
  log(`  Project. This is the same programme fault that 20260907100000 fixed in`);
  log(`  IBSubjectRecord, and deleting a student's academic records is not a`);
  log(`  decision a hydration script should make on its own.\n`);
}

await prisma.$disconnect();
log(DRY ? "Dry run complete. Nothing was written." : "Done.");
