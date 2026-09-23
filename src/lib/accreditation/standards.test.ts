import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PRACTICES, practiceByKey, practicesFor, type Category } from "./standards";

/**
 * The taxonomy is static reference data, so these tests guard the invariants a
 * typo would break: keys are what every tag in the database stores, so a
 * duplicate or a renamed key silently detaches evidence from its practice.
 */

describe("PRACTICES", () => {
  it("holds eighteen practices", () => {
    assert.equal(PRACTICES.length, 18);
  });

  it("gives every practice a unique key", () => {
    const keys = PRACTICES.map((p) => p.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("covers all four IB categories", () => {
    const seen = new Set<Category>(PRACTICES.map((p) => p.category));
    assert.deepEqual([...seen].sort(), ["CULTURE", "ENVIRONMENT", "LEARNING", "PURPOSE"]);
  });

  it("gives every practice at least one evidence kind that can satisfy it", () => {
    // A practice nothing can evidence is a permanent gap and a bug.
    for (const p of PRACTICES) {
      assert.ok(p.expects.length > 0, `${p.key} expects nothing`);
    }
  });
});

describe("practicesFor", () => {
  it("returns only practices a lesson plan can evidence", () => {
    const found = practicesFor("LESSON_PLAN");
    assert.ok(found.length > 0);
    assert.ok(found.every((p) => p.expects.includes("LESSON_PLAN")));
  });

  it("excludes practices that only documents can evidence", () => {
    const found = practicesFor("LESSON_PLAN").map((p) => p.key);
    const documentOnly = PRACTICES.filter(
      (p) => p.expects.length === 1 && p.expects[0] === "DOCUMENT",
    );
    assert.ok(documentOnly.length > 0, "taxonomy should have document-only practices");
    for (const p of documentOnly) assert.ok(!found.includes(p.key));
  });
});

describe("practiceByKey", () => {
  it("finds a known key and returns undefined for an unknown one", () => {
    assert.equal(practiceByKey(PRACTICES[0].key)?.key, PRACTICES[0].key);
    assert.equal(practiceByKey("nope-9.9"), undefined);
  });
});
