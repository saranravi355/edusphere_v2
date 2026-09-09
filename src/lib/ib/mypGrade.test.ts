import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MYP_GRADE_BOUNDARIES,
  criterionTotal,
  gradeToStore,
  mypGradeFromCriteria,
  mypGradeFromTotal,
} from "./mypGrade";

/**
 * The MYP criterion-to-grade conversion.
 *
 * A teacher marks four criteria out of 8 each; the IB publishes one table that
 * turns the 0-32 total into the 1-7 grade that goes on the report. Until now
 * this application asked the teacher for both halves as unconnected boxes and
 * checked neither against the other, so 214 of the 660 graded MYP records on
 * file carry a grade their own criteria do not support.
 *
 * The boundaries are the whole point of the module, so they are tested at their
 * edges rather than in their middles: every off-by-one here moves a real
 * student's reported grade by a whole band.
 */

/** The published table, written out independently of the implementation. */
const TABLE: [total: number, grade: number][] = [
  [0, 1], [5, 1],
  [6, 2], [9, 2],
  [10, 3], [14, 3],
  [15, 4], [18, 4],
  [19, 5], [23, 5],
  [24, 6], [27, 6],
  [28, 7], [32, 7],
];

describe("mypGradeFromTotal — the published boundaries", () => {
  it("puts every band's first and last total in that band", () => {
    for (const [total, grade] of TABLE) {
      assert.equal(mypGradeFromTotal(total), grade, `total ${total} should be grade ${grade}`);
    }
  });

  it("changes grade exactly at 6, 10, 15, 19, 24 and 28", () => {
    // The bug this module exists to prevent is a boundary off by one, so each
    // step is checked from both sides rather than trusted to the table above.
    for (const boundary of [6, 10, 15, 19, 24, 28]) {
      const below = mypGradeFromTotal(boundary - 1);
      const at = mypGradeFromTotal(boundary);
      assert.equal(at, below + 1, `total ${boundary} should be one grade above ${boundary - 1}`);
    }
  });

  it("gives every total from 0 to 32 a grade between 1 and 7", () => {
    for (let t = 0; t <= 32; t++) {
      const g = mypGradeFromTotal(t);
      assert.ok(Number.isInteger(g) && g >= 1 && g <= 7, `total ${t} produced ${g}`);
    }
  });

  it("never goes down as the total goes up", () => {
    for (let t = 1; t <= 32; t++) {
      assert.ok(
        mypGradeFromTotal(t) >= mypGradeFromTotal(t - 1),
        `total ${t} scored lower than ${t - 1}`,
      );
    }
  });

  it("covers 0 to 32 with seven bands that do not overlap or leave a gap", () => {
    const sorted = [...MYP_GRADE_BOUNDARIES].sort((a, b) => a.min - b.min);
    assert.equal(sorted.length, 7);
    assert.equal(sorted[0].min, 0, "the first band must start at 0");
    assert.equal(sorted[6].max, 32, "the last band must end at 32");
    for (let i = 1; i < sorted.length; i++) {
      assert.equal(sorted[i].min, sorted[i - 1].max + 1, `band ${i + 1} does not follow band ${i}`);
      assert.equal(sorted[i].grade, sorted[i - 1].grade + 1);
    }
  });

  it("refuses a total outside 0 to 32", () => {
    assert.throws(() => mypGradeFromTotal(-1), /0 and 32/);
    assert.throws(() => mypGradeFromTotal(33), /0 and 32/);
    assert.throws(() => mypGradeFromTotal(4.5), /whole number/);
  });
});

describe("criterionTotal", () => {
  it("adds the four criteria", () => {
    assert.equal(criterionTotal(8, 7, 6, 5), 26);
    assert.equal(criterionTotal(0, 0, 0, 0), 0);
    assert.equal(criterionTotal(8, 8, 8, 8), 32);
  });

  it("returns null when any criterion has not been marked", () => {
    // A partial set has no total: the table converts four criteria, and three
    // out of four would report a grade far below what the student will get.
    assert.equal(criterionTotal(8, 8, 8, null), null);
    assert.equal(criterionTotal(null, 8, 8, 8), null);
    assert.equal(criterionTotal(null, null, null, null), null);
  });

  it("treats a marked zero as a mark, not as missing", () => {
    assert.equal(criterionTotal(0, 4, 4, 4), 12);
  });

  it("returns null for a criterion outside 0 to 8", () => {
    assert.equal(criterionTotal(9, 4, 4, 4), null);
    assert.equal(criterionTotal(-1, 4, 4, 4), null);
    assert.equal(criterionTotal(4.5, 4, 4, 4), null);
  });
});

describe("mypGradeFromCriteria", () => {
  it("converts a full set of criteria to the reported grade", () => {
    assert.equal(mypGradeFromCriteria(8, 8, 7, 7), 7); // 30
    assert.equal(mypGradeFromCriteria(6, 6, 6, 6), 6); // 24
    assert.equal(mypGradeFromCriteria(5, 5, 5, 4), 5); // 19
    assert.equal(mypGradeFromCriteria(4, 4, 4, 3), 4); // 15
    assert.equal(mypGradeFromCriteria(3, 3, 2, 2), 3); // 10
    assert.equal(mypGradeFromCriteria(2, 2, 1, 1), 2); // 6
    assert.equal(mypGradeFromCriteria(1, 1, 1, 1), 1); // 4
  });

  it("gives a student who scored nothing a grade 1, not no grade", () => {
    assert.equal(mypGradeFromCriteria(0, 0, 0, 0), 1);
  });

  it("returns null while the set is still incomplete", () => {
    assert.equal(mypGradeFromCriteria(8, 8, 8, null), null);
  });

  it("is the composition of the two halves", () => {
    for (let a = 0; a <= 8; a++) {
      for (let b = 0; b <= 8; b += 3) {
        const total = criterionTotal(a, b, 4, 4);
        assert.equal(mypGradeFromCriteria(a, b, 4, 4), mypGradeFromTotal(total as number));
      }
    }
  });
});

describe("gradeToStore — what the save action writes", () => {
  const myp = { curriculum: "MYP" as const };
  const dp = { curriculum: "DP" as const };

  it("derives a MYP grade from the criteria, ignoring what was typed", () => {
    // The whole point: the criteria win. A teacher who marks a 30 and types 5
    // gets the 7 the table says, not the 5 they typed.
    assert.equal(gradeToStore({ ...myp, typed: 5, critA: 8, critB: 8, critC: 7, critD: 7 }), 7);
  });

  it("derives the same grade when the teacher typed nothing at all", () => {
    assert.equal(gradeToStore({ ...myp, typed: null, critA: 6, critB: 6, critC: 6, critD: 6 }), 6);
  });

  it("keeps the typed grade for a MYP record whose criteria are incomplete", () => {
    // Half the MYP records on file were graded before criteria were captured.
    // Deriving from three criteria would drop them a band or two; leaving the
    // typed grade alone means this change never makes a record worse.
    assert.equal(gradeToStore({ ...myp, typed: 6, critA: 8, critB: 8, critC: 8, critD: null }), 6);
    assert.equal(gradeToStore({ ...myp, typed: 6, critA: null, critB: null, critC: null, critD: null }), 6);
  });

  it("leaves DP grades alone — they are awarded, not computed", () => {
    // A DP grade comes from examiners against subject-specific boundaries that
    // move every session. Criteria on a DP record are not the MYP four.
    assert.equal(gradeToStore({ ...dp, typed: 5, critA: 8, critB: 8, critC: 8, critD: 8 }), 5);
    assert.equal(gradeToStore({ ...dp, typed: null, critA: 8, critB: 8, critC: 8, critD: 8 }), null);
  });

  it("returns null for a MYP record with neither criteria nor a typed grade", () => {
    assert.equal(gradeToStore({ ...myp, typed: null, critA: null, critB: null, critC: null, critD: null }), null);
  });

  it("agrees with the conversion for every complete MYP set", () => {
    for (const [a, b, c, d] of [[0, 0, 0, 0], [2, 1, 1, 2], [4, 4, 4, 3], [8, 8, 8, 8]]) {
      assert.equal(
        gradeToStore({ ...myp, typed: 1, critA: a, critB: b, critC: c, critD: d }),
        mypGradeFromCriteria(a, b, c, d),
      );
    }
  });
});
