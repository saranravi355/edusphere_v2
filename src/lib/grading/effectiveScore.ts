import type { GradedQuestion, GradingResult } from './types';

/** The minimal shape every caller here needs - matches an AIGradingSubmission row
 *  (result/teacherOverrideScore/teacherOverrideQuestionScores are stored as JSON columns on
 *  it), kept as a narrow interface rather than importing the Prisma type so this module has
 *  no database dependency of its own. */
export interface ScoredSubmission {
  result: GradingResult;
  teacherOverrideScore?: number | null;
  teacherOverrideQuestionScores?: Record<number, number> | null;
}

/** The score that actually counts for a student's paper: the teacher's whole-paper override
 *  if set, else the sum of per-question overrides (falling back to the AI's own score for any
 *  question the teacher didn't touch), else the AI's original total. Centralized here so the
 *  gradebook sync, the report view, the annotated-paper summary, and the CSV export can never
 *  disagree with each other about what "the final score" is. */
export function getEffectiveTotalScore(submission: ScoredSubmission): number {
  const r = submission.result;
  if (!r) return 0;
  if (typeof submission.teacherOverrideScore === 'number') return submission.teacherOverrideScore;
  const questionOverrides = submission.teacherOverrideQuestionScores;
  if (questionOverrides && Object.keys(questionOverrides).length > 0) {
    return r.questions.reduce((sum, q) => sum + (questionOverrides[q.number] ?? q.score), 0);
  }
  return r.totalScore;
}

export function isScoreOverridden(submission: ScoredSubmission): boolean {
  return (
    typeof submission.teacherOverrideScore === 'number' ||
    !!(submission.teacherOverrideQuestionScores && Object.keys(submission.teacherOverrideQuestionScores).length > 0)
  );
}

export function getEffectiveQuestionScore(submission: ScoredSubmission, question: GradedQuestion): number {
  return submission.teacherOverrideQuestionScores?.[question.number] ?? question.score;
}

export function isQuestionOverridden(submission: ScoredSubmission, questionNumber: number): boolean {
  return submission.teacherOverrideQuestionScores?.[questionNumber] !== undefined;
}

/** Same rule as getEffectiveTotalScore, for callers that already work with the individual
 *  pieces rather than a whole submission record. */
export function computeEffectiveScoreFromParts(
  totalScore: number,
  questions: GradedQuestion[],
  teacherOverrideScore: number | null | undefined,
  teacherOverrideQuestionScores: Record<number, number> | null | undefined
): number {
  if (typeof teacherOverrideScore === 'number') return teacherOverrideScore;
  if (teacherOverrideQuestionScores && Object.keys(teacherOverrideQuestionScores).length > 0) {
    return questions.reduce((sum, q) => sum + (teacherOverrideQuestionScores[q.number] ?? q.score), 0);
  }
  return totalScore;
}
