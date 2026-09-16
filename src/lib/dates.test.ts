import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { schoolMonthStart, schoolWeekday } from "./dates";

/**
 * The school runs on IST and the server may not. Every case here is an instant
 * where the two disagree about which day, month or year it is: between 00:00
 * and 05:30 IST a UTC host is still on the previous date.
 */

describe("schoolWeekday", () => {
  it("reads the day in IST, not the server's time zone", () => {
    // 20:00 UTC on Sunday 13 Sep is 01:30 IST on Monday 14 Sep. A UTC host
    // calling getDay() would say Sunday.
    assert.equal(schoolWeekday(new Date("2026-09-13T20:00:00Z")), 1);
  });

  it("agrees with UTC during the school's daytime", () => {
    assert.equal(schoolWeekday(new Date("2026-09-13T10:00:00Z")), 0);
  });
});

describe("schoolMonthStart", () => {
  it("is midnight IST on the 1st, as a UTC instant", () => {
    assert.equal(
      schoolMonthStart(new Date("2026-09-16T06:00:00Z")).toISOString(),
      "2026-08-31T18:30:00.000Z",
    );
  });

  it("has already turned the month at 01:30 IST on the 1st", () => {
    // 20:00 UTC on 30 Sep is 01:30 IST on 1 Oct. A UTC host building the month
    // from getFullYear()/getMonth() would still count from 1 Sep.
    assert.equal(
      schoolMonthStart(new Date("2026-09-30T20:00:00Z")).toISOString(),
      "2026-09-30T18:30:00.000Z",
    );
  });

  it("has not turned the month at 23:59 IST on the last day", () => {
    assert.equal(
      schoolMonthStart(new Date("2026-09-30T18:29:59Z")).toISOString(),
      "2026-08-31T18:30:00.000Z",
    );
  });

  it("turns the year in IST too", () => {
    // 00:30 IST on 1 Jan 2027 is still 31 Dec 2026 in UTC.
    assert.equal(
      schoolMonthStart(new Date("2026-12-31T19:00:00Z")).toISOString(),
      "2026-12-31T18:30:00.000Z",
    );
  });
});
