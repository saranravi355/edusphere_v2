import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getHeatmapData } from "./analytics";
import type { AnalyticsSubmission } from "./analytics";
import type { GradingResult } from "./types";

/**
 * A student with more than one graded paper this term - the normal case for a class analytics
 * page, not an edge case - used to produce one heatmap row per SUBMISSION instead of per
 * STUDENT: duplicate React keys, and the same student's name repeated down the table with
 * (coincidentally) identical numbers each time, since the cell lookup already collapsed to one
 * value per student+question regardless.
 */
function submission(over: Partial<AnalyticsSubmission> = {}): AnalyticsSubmission {
  const result = {
    maxTotal: 4,
    totalScore: 2,
    detectedSubject: "Psychology",
    scoreRationale: "",
    generalFeedback: [],
    annotations: [],
    questions: [
      { number: 1, score: 2, maxScore: 4, questionText: "Q1", answerText: "", feedback: "", confidence: 0.9, criteria: [] }
    ]
  } as unknown as GradingResult;

  return {
    studentId: "stu_1",
    studentName: "Aarav Patel",
    status: "EVALUATED",
    totalScore: 2,
    maxTotal: 4,
    result,
    ...over
  };
}

describe("getHeatmapData", () => {
  it("gives a student with several graded submissions exactly one row, not one per submission", () => {
    const submissions = [submission(), submission(), submission()];
    const heatmap = getHeatmapData(submissions);
    assert.equal(heatmap.students.length, 1);
    assert.equal(heatmap.students[0].studentId, "stu_1");
  });

  it("keeps one row per DISTINCT student", () => {
    const submissions = [
      submission({ studentId: "stu_1", studentName: "Aarav Patel" }),
      submission({ studentId: "stu_2", studentName: "Diya Sharma" }),
      submission({ studentId: "stu_1", studentName: "Aarav Patel" })
    ];
    const heatmap = getHeatmapData(submissions);
    assert.equal(heatmap.students.length, 2);
    assert.deepEqual(
      heatmap.students.map(s => s.studentId).sort(),
      ["stu_1", "stu_2"]
    );
  });

  it("every student row key is unique - the React duplicate-key bug this guards against", () => {
    const submissions = [submission(), submission(), submission({ studentId: "stu_2", studentName: "Diya Sharma" })];
    const heatmap = getHeatmapData(submissions);
    const keys = heatmap.students.map(s => s.studentId);
    assert.equal(new Set(keys).size, keys.length);
  });
});
