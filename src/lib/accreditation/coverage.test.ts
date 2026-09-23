import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classifyCoverage, coverageSummary, type TagFact } from "./coverage";
import { PRACTICES } from "./standards";
import type { EvidenceKind } from "./standards";

/**
 * The classification rules, which are the whole point of the module: a
 * dashboard that overstates evidence is worse than no dashboard.
 *
 * "Current academic year" is April-March (see academicYearOf), so NOW below is
 * deliberately placed mid-year with STALE in the preceding one.
 */

const NOW = new Date("2026-11-15T10:00:00+05:30");
const CURRENT = new Date("2026-09-01T10:00:00+05:30"); // same academic year as NOW
const STALE = new Date("2025-09-01T10:00:00+05:30");   // previous academic year

function tag(kind: EvidenceKind, status = "CONFIRMED", taggedAt = CURRENT): TagFact {
  return { standardKey: "learning-3.2", kind, status, taggedAt };
}

describe("classifyCoverage", () => {
  it("calls no tags at all a gap", () => {
    assert.equal(classifyCoverage([], NOW), "GAP");
  });

  it("calls one or two confirmed tags thin", () => {
    assert.equal(classifyCoverage([tag("LESSON_PLAN")], NOW), "THIN");
    assert.equal(classifyCoverage([tag("LESSON_PLAN"), tag("OBSERVATION")], NOW), "THIN");
  });

  it("calls three tags from a single kind thin, however many there are", () => {
    // Five lesson plans and nothing else is one teacher's view of their own
    // practice, not evidence that the practice is embedded.
    const five = [1, 2, 3, 4, 5].map(() => tag("LESSON_PLAN"));
    assert.equal(classifyCoverage(five, NOW), "THIN");
  });

  it("calls three tags across kinds thin when none is from this academic year", () => {
    const stale = [
      tag("LESSON_PLAN", "CONFIRMED", STALE),
      tag("OBSERVATION", "CONFIRMED", STALE),
      tag("PORTFOLIO_ITEM", "CONFIRMED", STALE),
    ];
    assert.equal(classifyCoverage(stale, NOW), "THIN");
  });

  it("calls three across two kinds with one current well evidenced", () => {
    const good = [
      tag("LESSON_PLAN", "CONFIRMED", CURRENT),
      tag("OBSERVATION", "CONFIRMED", STALE),
      tag("OBSERVATION", "CONFIRMED", STALE),
    ];
    assert.equal(classifyCoverage(good, NOW), "WELL_EVIDENCED");
  });

  it("ignores suggested tags entirely", () => {
    const suggested = [
      tag("LESSON_PLAN", "SUGGESTED"),
      tag("OBSERVATION", "SUGGESTED"),
      tag("PORTFOLIO_ITEM", "SUGGESTED"),
    ];
    assert.equal(classifyCoverage(suggested, NOW), "GAP");
  });

  it("ignores rejected tags entirely", () => {
    const mixed = [
      tag("LESSON_PLAN", "CONFIRMED"),
      tag("OBSERVATION", "REJECTED"),
      tag("PORTFOLIO_ITEM", "REJECTED"),
    ];
    assert.equal(classifyCoverage(mixed, NOW), "THIN");
  });

  it("straddles the 1 April boundary correctly", () => {
    // 31 March is the previous academic year; 1 April is this one.
    const marchNow = new Date("2027-04-02T10:00:00+05:30");
    const march31 = new Date("2027-03-31T10:00:00+05:30");
    const april1 = new Date("2027-04-01T10:00:00+05:30");

    const beforeRollover = [
      { ...tag("LESSON_PLAN"), taggedAt: march31 },
      { ...tag("OBSERVATION"), taggedAt: march31 },
      { ...tag("PORTFOLIO_ITEM"), taggedAt: march31 },
    ];
    assert.equal(classifyCoverage(beforeRollover, marchNow), "THIN");

    const afterRollover = [
      { ...tag("LESSON_PLAN"), taggedAt: april1 },
      { ...tag("OBSERVATION"), taggedAt: march31 },
      { ...tag("PORTFOLIO_ITEM"), taggedAt: march31 },
    ];
    assert.equal(classifyCoverage(afterRollover, marchNow), "WELL_EVIDENCED");
  });
});

describe("coverageSummary", () => {
  it("reports a tone for every practice in the taxonomy, even untagged ones", () => {
    const summary = coverageSummary([], NOW);
    assert.equal(summary.byPractice.size, PRACTICES.length);
    assert.equal(summary.gaps, PRACTICES.length);
    assert.equal(summary.wellEvidenced, 0);
    assert.equal(summary.thin, 0);
  });

  it("counts the three tones so they always total the taxonomy size", () => {
    const tags: TagFact[] = [
      { standardKey: "learning-3.2", kind: "LESSON_PLAN", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "learning-3.2", kind: "OBSERVATION", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "learning-3.2", kind: "PORTFOLIO_ITEM", status: "CONFIRMED", taggedAt: CURRENT },
      { standardKey: "culture-2.1", kind: "DOCUMENT", status: "CONFIRMED", taggedAt: CURRENT },
    ];
    const summary = coverageSummary(tags, NOW);
    assert.equal(summary.wellEvidenced, 1);
    assert.equal(summary.thin, 1);
    assert.equal(summary.gaps, PRACTICES.length - 2);
    assert.equal(
      summary.wellEvidenced + summary.thin + summary.gaps,
      PRACTICES.length,
    );
  });

  it("reports a tag whose standardKey left the taxonomy instead of dropping it", () => {
    // A key removed in a later deploy orphans live tags. Silently ignoring
    // them is an undercount nobody can explain, so they are named.
    const tags: TagFact[] = [
      { standardKey: "retired-9.9", kind: "DOCUMENT", status: "CONFIRMED", taggedAt: CURRENT },
    ];
    const summary = coverageSummary(tags, NOW);
    assert.deepEqual(summary.orphanKeys, ["retired-9.9"]);
    assert.equal(summary.byPractice.size, PRACTICES.length);
    assert.equal(summary.gaps, PRACTICES.length);
  });
});
