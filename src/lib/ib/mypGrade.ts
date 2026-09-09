/**
 * Turning MYP criterion levels into the 1-7 grade that goes on the report.
 *
 * A teacher marks four criteria out of 8 each. The IB publishes one table that
 * converts the 0-32 total into the 1-7 grade, and that conversion is the only
 * sanctioned route from criterion levels to a reported MYP grade — there is no
 * averaging, no rounding rule and no percentage anywhere in it.
 *
 * The application did not do this. `IBSubjectRecord` has four criterion columns
 * and a `currentGrade` column, and the grading screen asked the teacher to fill
 * in both as unconnected boxes: nothing derived one from the other and nothing
 * compared them. Of the 660 MYP records carrying both, 214 hold a grade their
 * own criteria do not support — a third of them, out by as much as two bands in
 * either direction. The student report card prints the criterion total in one
 * column and the grade in the next, under a line saying the total was converted
 * with the IB table, so the page shows the contradiction to whoever reads it.
 *
 * So the grade stops being something a teacher types. It is computed here, from
 * the criteria, and the boundaries live in one place that a test pins to the
 * published table.
 */

export interface MypGradeBoundary {
  grade: number;
  /** Inclusive. */
  min: number;
  /** Inclusive. */
  max: number;
}

/**
 * The published MYP grade boundaries, on the 0-32 sum of the four criteria.
 *
 * Unlike DP subject boundaries, which move every session and per subject, this
 * table is fixed across all MYP subject groups and is the same every year, so
 * it belongs in the code rather than in a table a coordinator has to maintain.
 */
export const MYP_GRADE_BOUNDARIES: readonly MypGradeBoundary[] = [
  { grade: 1, min: 0, max: 5 },
  { grade: 2, min: 6, max: 9 },
  { grade: 3, min: 10, max: 14 },
  { grade: 4, min: 15, max: 18 },
  { grade: 5, min: 19, max: 23 },
  { grade: 6, min: 24, max: 27 },
  { grade: 7, min: 28, max: 32 },
] as const;

export const CRITERION_TOTAL_MIN = 0;
export const CRITERION_TOTAL_MAX = 32;

/** One criterion level: a whole number from 0 to 8, or null if not yet marked. */
export type CriterionLevel = number | null | undefined;

function isValidCriterion(v: CriterionLevel): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 8;
}

/**
 * The 0-32 total, or null if the set is not complete and valid.
 *
 * Null rather than a partial sum on purpose: three criteria out of four add up
 * to a total that converts to a real-looking grade one or two bands below what
 * the student will actually be awarded. A missing criterion means "not graded
 * yet", and that has to stay distinguishable from "graded badly".
 *
 * A marked zero is a mark, so the check is on the value being absent, never on
 * it being falsy.
 */
export function criterionTotal(
  a: CriterionLevel,
  b: CriterionLevel,
  c: CriterionLevel,
  d: CriterionLevel,
): number | null {
  const levels = [a, b, c, d];
  if (!levels.every(isValidCriterion)) return null;
  return levels.reduce((sum, v) => sum + v, 0);
}

/**
 * The grade for a criterion total.
 *
 * Throws rather than returning a fallback for a total outside 0-32: every
 * caller reaches this through criterionTotal(), which cannot produce one, so an
 * out-of-range total means a bug upstream and quietly answering "grade 1" would
 * hide it in a student's report.
 */
export function mypGradeFromTotal(total: number): number {
  if (!Number.isInteger(total)) {
    throw new RangeError(`MYP criterion total must be a whole number, got ${total}`);
  }
  if (total < CRITERION_TOTAL_MIN || total > CRITERION_TOTAL_MAX) {
    throw new RangeError(`MYP criterion total must be between 0 and 32, got ${total}`);
  }
  const band = MYP_GRADE_BOUNDARIES.find((b) => total >= b.min && total <= b.max);
  // Unreachable while the table covers 0-32, which a test holds it to.
  if (!band) throw new RangeError(`No MYP grade band covers a total of ${total}`);
  return band.grade;
}

/**
 * The reported 1-7 grade for a full set of criteria, or null while incomplete.
 */
export function mypGradeFromCriteria(
  a: CriterionLevel,
  b: CriterionLevel,
  c: CriterionLevel,
  d: CriterionLevel,
): number | null {
  const total = criterionTotal(a, b, c, d);
  return total === null ? null : mypGradeFromTotal(total);
}

export interface GradeToStoreInput {
  /** The student's programme, from the Student row rather than the form. */
  curriculum: string;
  /** What the teacher put in the grade box, if anything. */
  typed: number | null;
  critA: CriterionLevel;
  critB: CriterionLevel;
  critC: CriterionLevel;
  critD: CriterionLevel;
}

/**
 * The grade a save should actually write.
 *
 * Three cases, and the middle one is why this is a function rather than a line
 * in the action:
 *
 *   MYP, four criteria marked  → the table decides, whatever was typed.
 *   MYP, criteria incomplete   → the typed grade stands.
 *   DP                         → the typed grade stands.
 *
 * The middle case keeps this change from making anything worse. Plenty of MYP
 * records were graded before criteria were being captured at all, and deriving
 * a grade from a partial set would drop those students a band or two on the
 * strength of criteria nobody has marked yet. So an incomplete set is treated
 * as no information, not as low marks.
 *
 * DP is left alone deliberately. A DP grade is awarded by examiners against
 * subject- and session-specific boundaries; nothing about it is computable from
 * four criterion columns, and those columns do not hold MYP criteria on a DP
 * record anyway.
 */
export function gradeToStore(input: GradeToStoreInput): number | null {
  if (input.curriculum !== "MYP") return input.typed;
  const derived = mypGradeFromCriteria(input.critA, input.critB, input.critC, input.critD);
  return derived ?? input.typed;
}
