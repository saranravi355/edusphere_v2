import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeGradeFromBoundaries, isCompleteBoundarySet } from "./gradeBoundaries";
import type { GradeBoundary } from "./types";

/**
 * Tests for the IB 1-7 course grade conversion.
 *
 * This module decides the grade printed against a student's name in the CSV
 * export teachers hand around, so a boundary that is off by one mark is a real
 * mis-grade rather than a cosmetic problem.
 *
 * The bug written down below: `computeGradeFromBoundaries` used to scale the
 * percentage UP (`pct * 100 >= b.minPercent`). That is not exact in binary
 * floating point - `0.29 * 100` is `28.999999999999996` - so a student sitting
 * EXACTLY on a boundary failed the `>=` and silently dropped a grade band. It
 * hit 29, 57 and 58 out of 100 among others, which are ordinary IB boundary
 * values, and nothing threw: the export was just quietly wrong.
 *
 * Note the unit contract, which is easy to get wrong at the call site: `pct` is
 * a FRACTION (0-1, as `score / maxTotal` in csv.ts), while `minPercent` is
 * 0-100.
 */

/** A complete, realistically-spaced HL boundary set. 29 and 57 are the values
 *  that used to fall through the float comparison. */
const FULL_SET: GradeBoundary[] = [
  { grade: 1, minPercent: 0 },
  { grade: 2, minPercent: 15 },
  { grade: 3, minPercent: 29 },
  { grade: 4, minPercent: 43 },
  { grade: 5, minPercent: 57 },
  { grade: 6, minPercent: 71 },
  { grade: 7, minPercent: 83 }
];

describe("computeGradeFromBoundaries", () => {
  it("gives a student sitting exactly on a boundary the higher grade", () => {
    // The two regression cases against this set. 29/100 is 0.29, and 0.29 * 100
    // is 28.999999999999996, so this used to return grade 2 instead of 3;
    // likewise 57 used to return 4 instead of 5.
    assert.equal(computeGradeFromBoundaries(29 / 100, FULL_SET), 3);
    assert.equal(computeGradeFromBoundaries(57 / 100, FULL_SET), 5);
  });

  it("is inclusive whichever integer the teacher set the boundary at", () => {
    // Whether the old code happened to survive depended on which integer the
    // boundary sat on - 58 was fine against a 57% boundary but broke against a
    // 58% one - so sweep every whole percent rather than trusting spot checks.
    for (let mark = 0; mark <= 100; mark++) {
      assert.equal(
        computeGradeFromBoundaries(mark / 100, [{ grade: 5, minPercent: mark }]),
        5,
        `a student on exactly ${mark}% missed a boundary set at ${mark}%`
      );
    }
  });

  it("is inclusive on every boundary in the set", () => {
    for (const b of FULL_SET) {
      assert.equal(
        computeGradeFromBoundaries(b.minPercent / 100, FULL_SET),
        b.grade,
        `a student on exactly ${b.minPercent}% should be grade ${b.grade}`
      );
    }
  });

  it("picks the highest grade the mark reaches, not the first entered", () => {
    assert.equal(computeGradeFromBoundaries(0.9, FULL_SET), 7);
    assert.equal(computeGradeFromBoundaries(0.72, FULL_SET), 6);
    assert.equal(computeGradeFromBoundaries(0.3, FULL_SET), 3);
  });

  it("does not depend on the order the boundaries were entered", () => {
    const shuffled = [FULL_SET[4], FULL_SET[0], FULL_SET[6], FULL_SET[2], FULL_SET[1], FULL_SET[5], FULL_SET[3]];
    for (const pct of [0, 0.29, 0.43, 0.57, 0.83, 1]) {
      assert.equal(
        computeGradeFromBoundaries(pct, shuffled),
        computeGradeFromBoundaries(pct, FULL_SET),
        `entry order changed the grade at ${pct}`
      );
    }
  });

  it("a mark one below a boundary stays in the lower band", () => {
    assert.equal(computeGradeFromBoundaries(28 / 100, FULL_SET), 2);
    assert.equal(computeGradeFromBoundaries(56 / 100, FULL_SET), 4);
  });

  it("returns null rather than a grade when no boundaries were entered", () => {
    // The documented rule: without real boundaries the UI must show the raw
    // score only, because IB boundaries vary by subject, level and session and
    // must never be guessed from a percentage table.
    assert.equal(computeGradeFromBoundaries(0.8, null), null);
    assert.equal(computeGradeFromBoundaries(0.8, undefined), null);
    assert.equal(computeGradeFromBoundaries(0.8, []), null);
  });

  it("returns null, not grade 1, for a mark below every entered boundary", () => {
    // A partial set that starts at 40% does not tell us grade 1 is correct at
    // 10% - it tells us the set does not cover that range.
    const partial: GradeBoundary[] = [
      { grade: 6, minPercent: 70 },
      { grade: 7, minPercent: 85 },
      { grade: 5, minPercent: 40 }
    ];
    assert.equal(computeGradeFromBoundaries(0.1, partial), null);
    assert.equal(computeGradeFromBoundaries(0.4, partial), 5);
  });

  it("handles marks out of a total that is not 100", () => {
    // 17/60 is 28.33%, below the 29% grade 3 boundary; 18/60 is 30%, above it.
    assert.equal(computeGradeFromBoundaries(17 / 60, FULL_SET), 2);
    assert.equal(computeGradeFromBoundaries(18 / 60, FULL_SET), 3);
    // A third of the marks on a 3-mark question, against a 33% boundary.
    assert.equal(computeGradeFromBoundaries(1 / 3, [{ grade: 4, minPercent: 100 / 3 }]), 4);
  });

  it("the boundary tolerance does not promote a student genuinely below it", () => {
    // The tolerance exists to rescue an exact-boundary student from float error,
    // never to round a real mark up. Half a mark out of 100 is still grade 2.
    assert.equal(computeGradeFromBoundaries(28.5 / 100, FULL_SET), 2);
    assert.equal(computeGradeFromBoundaries(28.999 / 100, FULL_SET), 2);
    // One mark below on a tight 200-mark paper, ~5e-3 in fraction units, is still
    // millions of times larger than the tolerance.
    assert.equal(computeGradeFromBoundaries(57 / 200, [{ grade: 5, minPercent: 29 }]), null);
  });

  it("does not mutate the caller's boundary array while sorting", () => {
    const original = [...FULL_SET];
    computeGradeFromBoundaries(0.5, FULL_SET);
    assert.deepEqual(FULL_SET, original);
  });

  it("handles the extremes", () => {
    assert.equal(computeGradeFromBoundaries(0, FULL_SET), 1);
    assert.equal(computeGradeFromBoundaries(1, FULL_SET), 7);
    // Above full marks (possible with a teacher override) still caps at 7.
    assert.equal(computeGradeFromBoundaries(1.2, FULL_SET), 7);
  });
});

describe("isCompleteBoundarySet", () => {
  it("accepts a set with all seven grades", () => {
    assert.equal(isCompleteBoundarySet(FULL_SET), true);
  });

  it("rejects a set still being typed", () => {
    assert.equal(isCompleteBoundarySet([]), false);
    assert.equal(isCompleteBoundarySet(FULL_SET.slice(0, 6)), false);
  });

  it("rejects a set missing a grade in the middle, not just the end", () => {
    assert.equal(isCompleteBoundarySet(FULL_SET.filter(b => b.grade !== 4)), false);
  });

  it("accepts duplicates as long as all seven grades appear", () => {
    // The teacher retyping a row should not make a complete set look incomplete.
    assert.equal(isCompleteBoundarySet([...FULL_SET, { grade: 4, minPercent: 44 }]), true);
  });
});
