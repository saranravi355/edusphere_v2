import type { GradeBoundary } from './types';

/** Tolerance for the boundary comparison below, in fraction units - 1e-9 here is a
 *  ten-millionth of a percentage point, far finer than any real mark can resolve (the
 *  tightest realistic case, one mark out of a few hundred, is ~1e-3), so it can only ever
 *  rescue a student sitting exactly on a boundary and never promote one genuinely below it. */
const EPSILON = 1e-9;

/** Computes the IB 1-7 course grade from real grade boundaries the teacher entered for this
 *  class/session - NEVER from a hardcoded percentage table. Real IB grade boundaries vary by
 *  subject, level, and exam session, so there is no universal formula; when no boundaries have
 *  been entered, this returns null and the UI must show only the raw score/percentage instead
 *  of a grade. Returns null (not grade 1) for a percentage below every entered boundary too,
 *  since that means the entered boundaries don't cover that range rather than that grade 1 is
 *  necessarily correct. */
export function computeGradeFromBoundaries(pct: number, boundaries: GradeBoundary[] | null | undefined): number | null {
  if (!boundaries || boundaries.length === 0) return null;
  const sorted = [...boundaries].sort((a, b) => b.minPercent - a.minPercent);
  for (const b of sorted) {
    // Scale the boundary DOWN rather than the percentage UP, and compare with a tolerance.
    // `pct * 100` is not exact in binary floating point - 0.29 * 100 is 28.999999999999996 -
    // so a student sitting exactly on a boundary (29/100 against a 29% boundary) failed this
    // `>=` and silently dropped a grade band. Dividing fixes the common case, but the two
    // sides can still round apart when the boundary is itself inexact (1/3 vs (100/3)/100),
    // so EPSILON makes the boundary reliably inclusive however each side was computed.
    if (pct >= b.minPercent / 100 - EPSILON) return b.grade;
  }
  return null;
}

/** A boundary set is "usable" once every grade 1-7 has an entry - partial entry is allowed
 *  while the teacher is still typing, but grading only kicks in once it's complete. */
export function isCompleteBoundarySet(boundaries: GradeBoundary[]): boolean {
  const grades = new Set(boundaries.map(b => b.grade));
  return [1, 2, 3, 4, 5, 6, 7].every(g => grades.has(g as GradeBoundary['grade']));
}
