import { describe, it } from "node:test";
import assert from "node:assert";
import { visibleTags, availablePractices, type TagView } from "./tagView";

describe("visibleTags", () => {
  it("readOnly with a mix of CONFIRMED/SUGGESTED/REJECTED → only the CONFIRMED ones are visible", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "CONFIRMED", note: null },
      { id: "2", standardKey: "culture-2.2", status: "SUGGESTED", note: null },
      { id: "3", standardKey: "culture-2.4", status: "REJECTED", note: null },
    ];

    const result = visibleTags({ tags, kind: "LESSON_PLAN", readOnly: true });

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, "1");
    assert.strictEqual(result[0].status, "CONFIRMED");
  });

  it("non-readOnly with a mix of CONFIRMED/SUGGESTED/REJECTED → CONFIRMED and SUGGESTED visible, REJECTED not", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "CONFIRMED", note: null },
      { id: "2", standardKey: "culture-2.2", status: "SUGGESTED", note: null },
      { id: "3", standardKey: "culture-2.4", status: "REJECTED", note: null },
    ];

    const result = visibleTags({ tags, kind: "LESSON_PLAN", readOnly: false });

    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(
      result.map((t) => t.id),
      ["1", "2"]
    );
  });

  it("readOnly with zero confirmed tags → returns empty array", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "SUGGESTED", note: null },
      { id: "2", standardKey: "culture-2.2", status: "REJECTED", note: null },
    ];

    const result = visibleTags({ tags, kind: "LESSON_PLAN", readOnly: true });

    assert.strictEqual(result.length, 0);
  });
});

describe("availablePractices", () => {
  it("a REJECTED tag on practice X → X is still offered in availablePractices", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "REJECTED", note: null },
    ];

    const result = availablePractices({ tags, kind: "LESSON_PLAN", readOnly: false });

    // LESSON_PLAN should have culture-2.1 available since it's only rejected
    const practice = result.find((p) => p.key === "culture-2.1");
    assert.ok(practice !== undefined);
  });

  it("a SUGGESTED tag on practice X → X is NOT offered", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "SUGGESTED", note: null },
    ];

    const result = availablePractices({ tags, kind: "LESSON_PLAN", readOnly: false });

    const practice = result.find((p) => p.key === "culture-2.1");
    assert.strictEqual(practice, undefined);
  });

  it("a CONFIRMED tag on practice X → X is NOT offered", () => {
    const tags: TagView[] = [
      { id: "1", standardKey: "culture-2.1", status: "CONFIRMED", note: null },
    ];

    const result = availablePractices({ tags, kind: "LESSON_PLAN", readOnly: false });

    const practice = result.find((p) => p.key === "culture-2.1");
    assert.strictEqual(practice, undefined);
  });

  it("availablePractices for LESSON_PLAN never returns a document-only practice", () => {
    // Get all practices for LESSON_PLAN
    const result = availablePractices({
      tags: [],
      kind: "LESSON_PLAN",
      readOnly: false,
    });

    // Check that none are document-only (we'll check by kind expectations)
    // A practice is offered if it's in expects for LESSON_PLAN
    for (const practice of result) {
      assert.ok(practice.expects.includes("LESSON_PLAN"));
    }
  });

  it("availablePractices for DOCUMENT never returns a lesson-plan-only practice", () => {
    const result = availablePractices({
      tags: [],
      kind: "DOCUMENT",
      readOnly: false,
    });

    // Check that none are lesson-plan-only
    for (const practice of result) {
      assert.ok(practice.expects.includes("DOCUMENT"));
    }
  });

  it("availablePractices respects readOnly parameter in filtering (should ignore it)", () => {
    // availablePractices doesn't actually use readOnly, but test that it's accepted
    const tags: TagView[] = [
      { id: "1", standardKey: "1.1", status: "CONFIRMED", note: null },
    ];

    const resultReadOnly = availablePractices({
      tags,
      kind: "LESSON_PLAN",
      readOnly: true,
    });
    const resultEdit = availablePractices({
      tags,
      kind: "LESSON_PLAN",
      readOnly: false,
    });

    // Should be identical since readOnly doesn't affect availablePractices
    assert.deepStrictEqual(resultReadOnly, resultEdit);
  });
});
