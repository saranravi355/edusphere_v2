import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classesCaption, rupees, schoolWeekday } from "./snapshot";

/**
 * The Today's Snapshot card draws a bare number, so these are the pieces that
 * decide what that number means to the reader.
 */

describe("schoolWeekday", () => {
  it("reads the day in IST, not the server's time zone", () => {
    // 20:00 UTC on Sunday 13 Sep is 01:30 IST on Monday 14 Sep. A UTC host
    // calling getDay() would say Sunday and report "No school today".
    assert.equal(schoolWeekday(new Date("2026-09-13T20:00:00Z")), 1);
  });

  it("agrees with UTC during the school's daytime", () => {
    assert.equal(schoolWeekday(new Date("2026-09-13T10:00:00Z")), 0);
  });
});

describe("classesCaption", () => {
  it("says a zero on a weekend is no school, not missing data", () => {
    assert.equal(classesCaption(0, 0), "No school today");
    assert.equal(classesCaption(0, 6), "No school today");
  });

  it("says a zero on a weekday is an empty timetable", () => {
    assert.equal(classesCaption(0, 3), "Nothing timetabled");
  });

  it("points at the timetable when there are classes", () => {
    assert.equal(classesCaption(4, 2), "View timetable");
  });
});

describe("rupees", () => {
  it("groups the way the school reads money", () => {
    assert.equal(rupees(2547), "₹2,547");
    assert.equal(rupees(1234567), "₹12,34,567");
  });

  it("puts the sign before the symbol and drops paise", () => {
    assert.equal(rupees(-120), "-₹120");
    assert.equal(rupees(2547.4), "₹2,547");
  });
});
