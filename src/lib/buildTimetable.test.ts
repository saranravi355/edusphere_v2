import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildWeeklyTimetable, type TimetableSubjectInput } from "./buildTimetable";

/**
 * The timetable builder.
 *
 * Small, but it decides what every student sees for their week, and its
 * promises are the kind that rot quietly: "deterministic", "balanced",
 * "non-repetitive". Nothing checked any of them.
 *
 * Reading it for testability turned up a live bug, fixed in the same commit:
 * roomFor() tested `science` before `computer`, so "Computer Science" — a
 * subject this codebase names in lib/grading/subjectObjectives.ts — matched
 * "science" first and was sent to the Science Lab. The Computing Lab branch was
 * unreachable for the only subject it exists for. That case is below.
 */

const DAYS = 5;
const PERIODS = 6;
/** Wednesday and Friday give up their last period, so 30 slots minus 2. */
const LESSONS_PER_WEEK = DAYS * PERIODS - 2;

const subject = (subjectName: string, level = "HL", subjectGroup = 4): TimetableSubjectInput => ({
  subjectName,
  level,
  subjectGroup,
});

/** A full diploma load: one subject from each of the six groups. */
const SIX: TimetableSubjectInput[] = [
  subject("English A: Language & Literature", "SL", 1),
  subject("Spanish B", "SL", 2),
  subject("Economics", "HL", 3),
  subject("Physics", "HL", 4),
  subject("Mathematics: Analysis & Approaches", "HL", 5),
  subject("Visual Arts", "SL", 6),
];

describe("buildWeeklyTimetable — shape of the week", () => {
  it("returns nothing for a student with no subjects", () => {
    assert.deepEqual(buildWeeklyTimetable([]), []);
    assert.deepEqual(buildWeeklyTimetable([], ["Meena"]), []);
  });

  it("fills every teaching slot in the week", () => {
    assert.equal(buildWeeklyTimetable(SIX).length, LESSONS_PER_WEEK);
  });

  it("stays inside Monday–Friday and periods 1–6", () => {
    for (const e of buildWeeklyTimetable(SIX)) {
      assert.ok(e.dayOfWeek >= 1 && e.dayOfWeek <= DAYS, `day ${e.dayOfWeek} out of range`);
      assert.ok(e.period >= 1 && e.period <= PERIODS, `period ${e.period} out of range`);
    }
  });

  it("leaves Wednesday and Friday last period free, and no other", () => {
    const slots = new Set(buildWeeklyTimetable(SIX).map((e) => `${e.dayOfWeek}-${e.period}`));
    assert.ok(!slots.has("3-6"), "Wednesday last period should be free");
    assert.ok(!slots.has("5-6"), "Friday last period should be free");
    for (const day of [1, 2, 4]) {
      assert.ok(slots.has(`${day}-6`), `day ${day} should still teach period 6`);
    }
  });

  it("never books two lessons in one slot", () => {
    const entries = buildWeeklyTimetable(SIX);
    const slots = new Set(entries.map((e) => `${e.dayOfWeek}-${e.period}`));
    assert.equal(slots.size, entries.length);
  });

  it("gives every entry its own id", () => {
    const ids = buildWeeklyTimetable(SIX).map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("carries the level through untouched", () => {
    const byName = new Map(SIX.map((s) => [s.subjectName, s.level]));
    for (const e of buildWeeklyTimetable(SIX)) {
      assert.equal(e.level, byName.get(e.subject), `${e.subject} lost its level`);
    }
  });
});

describe("buildWeeklyTimetable — the promises in its own comment", () => {
  it("is deterministic: the same student gets the same week twice", () => {
    assert.deepEqual(buildWeeklyTimetable(SIX, ["A", "B"]), buildWeeklyTimetable(SIX, ["A", "B"]));
  });

  it("teaches every subject during the week", () => {
    const taught = new Set(buildWeeklyTimetable(SIX).map((e) => e.subject));
    for (const s of SIX) assert.ok(taught.has(s.subjectName), `${s.subjectName} never appears`);
  });

  it("does not teach the same subject twice in one day", () => {
    // True when the student has at least as many subjects as there are periods,
    // which is the case the rotation is built for.
    for (let day = 1; day <= DAYS; day++) {
      const onDay = buildWeeklyTimetable(SIX).filter((e) => e.dayOfWeek === day).map((e) => e.subject);
      assert.equal(new Set(onDay).size, onDay.length, `day ${day} repeats a subject`);
    }
  });

  it("rotates by exactly one period each day", () => {
    // The "Latin-square" claim: what sits in period 2 today sits in period 1
    // tomorrow. Checked against the entries rather than the arithmetic.
    const entries = buildWeeklyTimetable(SIX);
    const at = (d: number, p: number) => entries.find((e) => e.dayOfWeek === d && e.period === p)?.subject;
    for (let day = 1; day < DAYS; day++) {
      assert.equal(at(day + 1, 1), at(day, 2), `day ${day + 1} did not shift from day ${day}`);
    }
  });

  it("copes with fewer subjects than periods rather than leaving holes", () => {
    for (const count of [1, 2, 3, 4]) {
      const few = SIX.slice(0, count);
      const entries = buildWeeklyTimetable(few);
      assert.equal(entries.length, LESSONS_PER_WEEK, `${count} subject(s) should still fill the week`);
      assert.ok(entries.every((e) => e.subject.length > 0));
    }
  });
});

describe("buildWeeklyTimetable — teachers", () => {
  it("leaves the teacher blank when none are supplied", () => {
    assert.ok(buildWeeklyTimetable(SIX).every((e) => e.teacher === ""));
  });

  it("keeps one teacher per subject all week", () => {
    // A subject that changed teacher between Monday and Thursday would be a
    // timetable nobody could follow.
    const bySubject = new Map<string, string>();
    for (const e of buildWeeklyTimetable(SIX, ["Meena", "Rajesh", "Anaya", "Vikram", "Sindhu", "Priya"])) {
      const seen = bySubject.get(e.subject);
      if (seen === undefined) bySubject.set(e.subject, e.teacher);
      else assert.equal(e.teacher, seen, `${e.subject} changed teacher mid-week`);
    }
    assert.equal(bySubject.size, SIX.length);
  });

  it("shares a short staff list around rather than running out", () => {
    const entries = buildWeeklyTimetable(SIX, ["Meena", "Rajesh"]);
    assert.ok(entries.every((e) => e.teacher === "Meena" || e.teacher === "Rajesh"));
    assert.equal(new Set(entries.map((e) => e.teacher)).size, 2);
  });
});

describe("buildWeeklyTimetable — rooms", () => {
  const roomOf = (name: string) => buildWeeklyTimetable([subject(name)])[0].room;

  it("sends Computer Science to the Computing Lab, not a wet lab", () => {
    // The bug this file was written for: "Computer Science" contains "science",
    // and science used to be tested first, so the Computing Lab was unreachable.
    assert.equal(roomOf("Computer Science"), "Computing Lab");
    assert.equal(roomOf("computer science"), "Computing Lab");
  });

  it("sends each laboratory subject to its own laboratory", () => {
    assert.equal(roomOf("Physics"), "Physics Lab");
    assert.equal(roomOf("Chemistry"), "Chemistry Lab");
    assert.equal(roomOf("Biology"), "Biology Lab");
    assert.equal(roomOf("Sciences"), "Science Lab");
  });

  it("sends the arts to their own spaces", () => {
    assert.equal(roomOf("Visual Arts"), "Art Studio");
    assert.equal(roomOf("Music"), "Music Room");
    assert.equal(roomOf("Theatre"), "Drama Studio");
    assert.equal(roomOf("Film"), "Drama Studio");
  });

  it("matches whatever the subject is called, in any case", () => {
    assert.equal(roomOf("PHYSICS"), "Physics Lab");
    assert.equal(roomOf("Physics HL"), "Physics Lab");
  });

  it("gives everything else a numbered classroom", () => {
    for (const name of ["Economics", "Spanish B", "Mathematics: Analysis & Approaches"]) {
      assert.match(roomOf(name), /^Room 2(0\d|1[01])$/, `${name} should get a numbered room`);
    }
  });

  it("keeps a subject in the same room all week", () => {
    const rooms = new Map<string, string>();
    for (const e of buildWeeklyTimetable(SIX)) {
      const seen = rooms.get(e.subject);
      if (seen === undefined) rooms.set(e.subject, e.room);
      else assert.equal(e.room, seen, `${e.subject} moved room mid-week`);
    }
  });
});
