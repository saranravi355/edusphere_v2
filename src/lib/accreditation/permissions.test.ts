import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { mayTagRecord } from "./permissions";

/**
 * The ownership decision behind mayTag() in
 * src/app/(portals)/admin/accreditation/actions.ts, extracted so the highest-
 * risk logic in the module — who may tag what — can be tested without a
 * database. actions.ts does the Prisma lookups and hands the results here as
 * plain facts; this file owns none of the I/O and none of the trust.
 */

describe("mayTagRecord", () => {
  it("lets an admin bypass every kind, including DOCUMENT and OBSERVATION", () => {
    for (const role of ["SUPER_ADMIN", "PRINCIPAL"]) {
      assert.equal(mayTagRecord({ role, kind: "DOCUMENT", isTeacher: false }), true);
      assert.equal(mayTagRecord({ role, kind: "OBSERVATION", isTeacher: false }), true);
      assert.equal(
        mayTagRecord({ role, kind: "LESSON_PLAN", isTeacher: false, ownsLessonPlan: false }),
        true,
      );
      assert.equal(
        mayTagRecord({
          role,
          kind: "PORTFOLIO_ITEM",
          isTeacher: false,
          recordClassroomId: "c1",
          classroomIds: [],
        }),
        true,
      );
    }
  });

  it("lets a teacher tag their own lesson plan", () => {
    assert.equal(
      mayTagRecord({ role: "SUBJECT_TEACHER", kind: "LESSON_PLAN", isTeacher: true, ownsLessonPlan: true }),
      true,
    );
  });

  it("refuses a teacher tagging another teacher's lesson plan", () => {
    assert.equal(
      mayTagRecord({ role: "SUBJECT_TEACHER", kind: "LESSON_PLAN", isTeacher: true, ownsLessonPlan: false }),
      false,
    );
  });

  it("always refuses a teacher tagging an OBSERVATION, never a permissive fallthrough", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        kind: "OBSERVATION",
        isTeacher: true,
        ownsLessonPlan: true,
        recordClassroomId: "c1",
        classroomIds: ["c1"],
      }),
      false,
    );
  });

  it("always refuses a teacher tagging a DOCUMENT", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        kind: "DOCUMENT",
        isTeacher: true,
        recordClassroomId: "c1",
        classroomIds: ["c1"],
      }),
      false,
    );
  });

  it("allows a portfolio item whose student's classroom is one the teacher teaches", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        kind: "PORTFOLIO_ITEM",
        isTeacher: true,
        recordClassroomId: "c1",
        classroomIds: ["c1", "c2"],
      }),
      true,
    );
  });

  it("allows an assessment result whose student's classroom is one the teacher teaches", () => {
    assert.equal(
      mayTagRecord({
        role: "SUBJECT_TEACHER",
        kind: "ASSESSMENT_RESULT",
        isTeacher: true,
        recordClassroomId: "c2",
        classroomIds: ["c1", "c2"],
      }),
      true,
    );
  });

  it("refuses a portfolio item whose student's classroom is outside the teacher's classrooms", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        kind: "PORTFOLIO_ITEM",
        isTeacher: true,
        recordClassroomId: "c3",
        classroomIds: ["c1", "c2"],
      }),
      false,
    );
  });

  it("refuses an assessment result with no classroom on the record", () => {
    assert.equal(
      mayTagRecord({
        role: "SUBJECT_TEACHER",
        kind: "ASSESSMENT_RESULT",
        isTeacher: true,
        recordClassroomId: null,
        classroomIds: ["c1"],
      }),
      false,
    );
  });

  it("denies when classroomIds is empty, rather than allowing", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        kind: "PORTFOLIO_ITEM",
        isTeacher: true,
        recordClassroomId: "c1",
        classroomIds: [],
      }),
      false,
    );
  });

  it("denies a caller with no teacher row", () => {
    assert.equal(
      mayTagRecord({ role: "CLASS_TEACHER", kind: "LESSON_PLAN", isTeacher: false, ownsLessonPlan: true }),
      false,
    );
    assert.equal(
      mayTagRecord({
        role: "SUBJECT_TEACHER",
        kind: "PORTFOLIO_ITEM",
        isTeacher: false,
        recordClassroomId: "c1",
        classroomIds: ["c1"],
      }),
      false,
    );
  });

  it("denies an unrecognised kind rather than falling through permissively", () => {
    assert.equal(
      mayTagRecord({
        role: "CLASS_TEACHER",
        // @ts-expect-error deliberately outside the EvidenceKind union — a raw
        // POST can send any string, and this must not fall through to allow.
        kind: "SOMETHING_ELSE",
        isTeacher: true,
        ownsLessonPlan: true,
        recordClassroomId: "c1",
        classroomIds: ["c1"],
      }),
      false,
    );
  });
});
