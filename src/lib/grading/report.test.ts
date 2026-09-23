import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildClassSummaryPdf, buildIndividualPdf, pdfSafe } from "./report";
import type { SubmissionRow } from "@/app/(portals)/teacher/grading/ai-grader/types";
import type { GradingResult } from "./types";

/**
 * The AI writes the text in these reports, so it decides which characters end
 * up in them. pdf-lib's standard fonts can only encode WinAnsi, and a
 * character outside it does not degrade — it throws, and the download fails
 * with a 500. The model reaches for a non-breaking hyphen (U+2011) in phrases
 * like "criterion‑referenced" often enough that 20 of the 32 graded
 * submissions in the database carry one.
 */

const NB_HYPHEN = "‑";

function row(over: Partial<SubmissionRow> = {}): SubmissionRow {
  const result = {
    maxTotal: 28,
    totalScore: 8,
    detectedSubject: "Psychology",
    scoreRationale: `Marks follow the criterion${NB_HYPHEN}referenced descriptors.`,
    generalFeedback: [`Use command terms in a well${NB_HYPHEN}structured answer → then justify.`],
    annotations: [],
    questions: [
      {
        number: 1,
        score: 2,
        maxScore: 7,
        questionText: `Outline one non${NB_HYPHEN}experimental method.`,
        answerText: "…",
        feedback: `Define the method, then evaluate it — 10 ≤ marks.`,
        confidence: 0.9,
        criteria: [{ code: "A", name: "Knowledge", score: 2, maxScore: 7, comment: `Partly context${NB_HYPHEN}free.` }],
      },
    ],
  } as unknown as GradingResult;

  return {
    id: "sub_1",
    studentId: "stu_1",
    studentName: "Ananya Rao",
    registrationNo: "DP1C-004",
    originalFileName: "sheet.pdf",
    batchId: null,
    subjectName: "Psychology",
    title: "Paper 1 mock",
    term: "Term 1 2026-27",
    programme: "DP",
    status: "EVALUATED",
    errorMessage: null,
    totalScore: 8,
    maxTotal: 28,
    teacherOverrideScore: null,
    teacherOverrideQuestionScores: null,
    teacherFeedback: null,
    result,
    ocrText: null,
    ocrPages: null,
    ocrConfidence: null,
    fileUrl: "https://example.test/sheet.pdf",
    createdAt: new Date("2026-09-21T18:18:56.877Z").toISOString(),
    ...over,
  } as SubmissionRow;
}

const isPdf = (bytes: Uint8Array) => Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-";

describe("pdfSafe", () => {
  it("turns the hyphens the model uses into ones the font has", () => {
    assert.equal(pdfSafe(`criterion${NB_HYPHEN}referenced`), "criterion-referenced");
    assert.equal(pdfSafe("‐dash ‒dash −minus"), "-dash -dash -minus");
  });

  it("spells out arrows and maths signs rather than dropping the meaning", () => {
    assert.equal(pdfSafe("cause → effect"), "cause -> effect");
    assert.equal(pdfSafe("marks ≤ 7 and ≥ 0"), "marks <= 7 and >= 0");
  });

  it("keeps the punctuation the font already has", () => {
    assert.equal(pdfSafe("“quoted” — it’s fine… • 5°C café"), "“quoted” — it’s fine… • 5°C café");
  });

  it("replaces anything else it cannot draw, instead of throwing", () => {
    assert.equal(pdfSafe("grade कख here"), "grade ?? here");
    assert.equal(pdfSafe("zero​width"), "zerowidth");
  });
});

describe("buildIndividualPdf", () => {
  it("builds a PDF from text the standard font cannot encode", async () => {
    const bytes = await buildIndividualPdf(row());
    assert.ok(isPdf(bytes), "expected a PDF");
    assert.ok(bytes.length > 1000, "expected a non-trivial PDF");
  });

  it("builds a PDF when the student's own name is outside WinAnsi", async () => {
    const bytes = await buildIndividualPdf(row({ studentName: "आरव Rao" }));
    assert.ok(isPdf(bytes), "expected a PDF");
  });
});

describe("buildClassSummaryPdf", () => {
  it("builds a class gradesheet from the same text", async () => {
    const bytes = await buildClassSummaryPdf("DP1C", "Paper 1 mock", [row(), row({ id: "sub_2" })]);
    assert.ok(isPdf(bytes), "expected a PDF");
  });
});
