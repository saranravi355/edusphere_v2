import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BAND_HEX, BAND_LABELS, getBand } from "./gradeBands";

/**
 * The good/moderate/weak banding behind the analytics colours. Unlike the IB
 * 1-7 grade, this is a presentational bucket rather than a reported grade, so
 * the thresholds are this app's own: >= 70% good, >= 40% moderate, below that
 * weak.
 *
 * The `maxScore <= 0` guard matters because an unmarked or zero-mark question
 * would otherwise divide by zero and band as NaN, which paints no bar at all.
 */

describe("getBand", () => {
  it("bands a clear pass, a middling answer and a poor one", () => {
    assert.equal(getBand(9, 10), "good");
    assert.equal(getBand(5, 10), "moderate");
    assert.equal(getBand(1, 10), "weak");
  });

  it("is inclusive on both thresholds", () => {
    assert.equal(getBand(7, 10), "good");
    assert.equal(getBand(4, 10), "moderate");
    // And just below each one.
    assert.equal(getBand(6.9, 10), "moderate");
    assert.equal(getBand(3.9, 10), "weak");
  });

  it("holds the thresholds on totals that are not 10", () => {
    assert.equal(getBand(21, 30), "good");
    assert.equal(getBand(12, 30), "moderate");
    assert.equal(getBand(35, 50), "good");
    assert.equal(getBand(20, 50), "moderate");
  });

  it("bands a zero-mark question weak instead of dividing by zero", () => {
    assert.equal(getBand(0, 0), "weak");
    assert.equal(getBand(5, 0), "weak");
    assert.equal(getBand(5, -1), "weak");
  });

  it("handles the extremes", () => {
    assert.equal(getBand(0, 10), "weak");
    assert.equal(getBand(10, 10), "good");
    // Above full marks, possible after a teacher override.
    assert.equal(getBand(12, 10), "good");
  });
});

describe("band presentation", () => {
  it("labels and colours every band", () => {
    for (const band of ["good", "moderate", "weak"] as const) {
      assert.ok(BAND_LABELS[band], `${band} has no label`);
      assert.match(BAND_HEX[band], /^#[0-9a-f]{6}$/, `${band} needs a hex value for recharts`);
    }
  });

  it("gives each band a distinct colour", () => {
    const hexes = Object.values(BAND_HEX);
    assert.equal(new Set(hexes).size, hexes.length);
  });
});
