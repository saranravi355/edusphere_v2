import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeEffectiveScoreFromParts,
  getEffectiveQuestionScore,
  getEffectiveTotalScore,
  isQuestionOverridden,
  isScoreOverridden
} from "./effectiveScore";
import type { ScoredSubmission } from "./effectiveScore";
import type { GradedQuestion, GradingResult } from "./types";

/**
 * Tests for "what is this paper's final score", which the gradebook sync, the
 * report view, the annotated-paper summary and the CSV export all read. The
 * whole point of the module is that those four can never disagree, so the
 * precedence rule is what is pinned down here:
 *
 *   whole-paper override  >  per-question overrides  >  the AI's own total
 *
 * The cases that matter are the falsy ones. A teacher overriding a paper to
 * ZERO is a real thing they do, and it must not fall through to the AI score
 * the way a `!teacherOverrideScore` check would.
 */

function question(number: number, score: number, maxScore = 10): GradedQuestion {
  return {
    number,
    questionText: `Q${number}`,
    answerText: "",
    score,
    maxScore,
    feedback: "",
    criteria: [],
    confidence: null
  };
}

function result(questions: GradedQuestion[], totalScore: number): GradingResult {
  return {
    questions,
    generalFeedback: [],
    totalScore,
    maxTotal: questions.length * 10,
    detectedSubject: "Mathematics",
    annotations: []
  };
}

/** Three questions the AI scored 8 + 5 + 2 = 15. */
const QUESTIONS = [question(1, 8), question(2, 5), question(3, 2)];
const AI_ONLY: ScoredSubmission = { result: result(QUESTIONS, 15) };

describe("getEffectiveTotalScore", () => {
  it("uses the AI total when the teacher has not touched it", () => {
    assert.equal(getEffectiveTotalScore(AI_ONLY), 15);
  });

  it("prefers a whole-paper override over everything else", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideScore: 20,
      teacherOverrideQuestionScores: { 1: 1, 2: 1, 3: 1 }
    };
    assert.equal(getEffectiveTotalScore(submission), 20);
  });

  it("honours a whole-paper override of zero", () => {
    // The falsy trap: a paper the teacher zeroed must score 0, not 15.
    assert.equal(getEffectiveTotalScore({ result: result(QUESTIONS, 15), teacherOverrideScore: 0 }), 0);
  });

  it("sums per-question overrides, keeping the AI score for untouched questions", () => {
    // Teacher regraded Q2 from 5 to 9; Q1 and Q3 keep 8 and 2.
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: { 2: 9 }
    };
    assert.equal(getEffectiveTotalScore(submission), 19);
  });

  it("honours a per-question override of zero", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: { 1: 0 }
    };
    assert.equal(getEffectiveTotalScore(submission), 7);
  });

  it("ignores an empty override object", () => {
    // Clearing every override should return the paper to the AI's total rather
    // than summing an empty map to 0.
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: {}
    };
    assert.equal(getEffectiveTotalScore(submission), 15);
  });

  it("treats null overrides as absent", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideScore: null,
      teacherOverrideQuestionScores: null
    };
    assert.equal(getEffectiveTotalScore(submission), 15);
  });

  it("sums from the questions, so an override for a question that is not on the paper is ignored", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: { 99: 100 }
    };
    assert.equal(getEffectiveTotalScore(submission), 15);
  });
});

describe("isScoreOverridden", () => {
  it("is false for an untouched paper", () => {
    assert.equal(isScoreOverridden(AI_ONLY), false);
    assert.equal(isScoreOverridden({ result: result(QUESTIONS, 15), teacherOverrideQuestionScores: {} }), false);
  });

  it("is true for a whole-paper override, including zero", () => {
    assert.equal(isScoreOverridden({ result: result(QUESTIONS, 15), teacherOverrideScore: 20 }), true);
    assert.equal(isScoreOverridden({ result: result(QUESTIONS, 15), teacherOverrideScore: 0 }), true);
  });

  it("is true when any question was overridden", () => {
    assert.equal(
      isScoreOverridden({ result: result(QUESTIONS, 15), teacherOverrideQuestionScores: { 2: 9 } }),
      true
    );
  });
});

describe("getEffectiveQuestionScore / isQuestionOverridden", () => {
  it("falls back to the AI score for an untouched question", () => {
    assert.equal(getEffectiveQuestionScore(AI_ONLY, QUESTIONS[0]), 8);
    assert.equal(isQuestionOverridden(AI_ONLY, 1), false);
  });

  it("returns the override where one exists", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: { 2: 9 }
    };
    assert.equal(getEffectiveQuestionScore(submission, QUESTIONS[1]), 9);
    assert.equal(isQuestionOverridden(submission, 2), true);
    assert.equal(isQuestionOverridden(submission, 1), false);
  });

  it("counts an override of zero as an override", () => {
    const submission: ScoredSubmission = {
      result: result(QUESTIONS, 15),
      teacherOverrideQuestionScores: { 1: 0 }
    };
    assert.equal(getEffectiveQuestionScore(submission, QUESTIONS[0]), 0);
    assert.equal(isQuestionOverridden(submission, 1), true);
  });
});

describe("computeEffectiveScoreFromParts", () => {
  it("agrees with getEffectiveTotalScore on the same inputs", () => {
    const cases: ScoredSubmission[] = [
      AI_ONLY,
      { result: result(QUESTIONS, 15), teacherOverrideScore: 20 },
      { result: result(QUESTIONS, 15), teacherOverrideScore: 0 },
      { result: result(QUESTIONS, 15), teacherOverrideQuestionScores: { 2: 9 } },
      { result: result(QUESTIONS, 15), teacherOverrideQuestionScores: {} },
      { result: result(QUESTIONS, 15), teacherOverrideScore: null, teacherOverrideQuestionScores: null }
    ];
    // The two entry points exist so callers can pass either a whole record or
    // the loose pieces; they must never disagree about the final score.
    for (const c of cases) {
      assert.equal(
        computeEffectiveScoreFromParts(
          c.result.totalScore,
          c.result.questions,
          c.teacherOverrideScore,
          c.teacherOverrideQuestionScores
        ),
        getEffectiveTotalScore(c)
      );
    }
  });
});
