import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { columnFor, sourceOf } from "./source";

/**
 * A tag points at exactly one of five records. The database enforces that with
 * a check constraint; this function is how the application reads it back, and
 * it throws rather than guessing, because a tag with two sources set means the
 * constraint was bypassed and the coverage figures are already wrong.
 */

describe("sourceOf", () => {
  it("resolves each of the five kinds", () => {
    assert.deepEqual(sourceOf({ lessonPlanId: "lp1" }), { kind: "LESSON_PLAN", id: "lp1" });
    assert.deepEqual(sourceOf({ portfolioItemId: "pi1" }), { kind: "PORTFOLIO_ITEM", id: "pi1" });
    assert.deepEqual(sourceOf({ assessmentResultId: "ar1" }), { kind: "ASSESSMENT_RESULT", id: "ar1" });
    assert.deepEqual(sourceOf({ observationId: "ob1" }), { kind: "OBSERVATION", id: "ob1" });
    assert.deepEqual(sourceOf({ documentId: "doc1" }), { kind: "DOCUMENT", id: "doc1" });
  });

  it("ignores explicit nulls alongside the one set column", () => {
    assert.deepEqual(
      sourceOf({ lessonPlanId: null, portfolioItemId: "pi1", documentId: null }),
      { kind: "PORTFOLIO_ITEM", id: "pi1" },
    );
  });

  it("throws when nothing is set", () => {
    assert.throws(() => sourceOf({}), /no source/i);
    assert.throws(() => sourceOf({ lessonPlanId: null }), /no source/i);
  });

  it("throws when more than one is set", () => {
    assert.throws(
      () => sourceOf({ lessonPlanId: "lp1", documentId: "doc1" }),
      /more than one source/i,
    );
  });
});

describe("columnFor", () => {
  it("maps every kind back to its column", () => {
    assert.equal(columnFor("LESSON_PLAN"), "lessonPlanId");
    assert.equal(columnFor("DOCUMENT"), "documentId");
  });
});
