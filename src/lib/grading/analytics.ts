import { getBand } from './gradeBands';
import type { Band } from './gradeBands';
import { getEffectiveTotalScore, getEffectiveQuestionScore } from './effectiveScore';
import type { GradingResult } from './types';

/** The minimal shape every function here needs - matches SubmissionRow (app/.../ai-grader/types.ts)
 *  structurally, kept as a narrow interface so this module doesn't depend on an app-layer type. */
export interface AnalyticsSubmission {
  studentId: string;
  studentName: string;
  status: string;
  result: GradingResult;
  totalScore: number;
  maxTotal: number;
  teacherOverrideScore?: number | null;
  teacherOverrideQuestionScores?: Record<number, number> | null;
}

/** Only these statuses carry a real, trustworthy result - OCR_PROCESSING/EVALUATING have no
 *  result yet, and FAILED's result is an empty placeholder written at upload time. */
function graded(submissions: AnalyticsSubmission[]) {
  return submissions.filter(s => ['EVALUATED', 'NEEDS_REVIEW', 'PUBLISHED'].includes(s.status));
}

export interface BandCount {
  band: Band;
  count: number;
}

/** How many graded papers fall into each score band (using the teacher's effective score, not
 *  just the AI's raw one) - feeds the donut chart. */
export function getBandCounts(submissions: AnalyticsSubmission[]): BandCount[] {
  const counts: Record<Band, number> = { good: 0, moderate: 0, weak: 0 };
  graded(submissions).forEach(s => {
    const score = getEffectiveTotalScore(s);
    counts[getBand(score, s.maxTotal)]++;
  });
  return (['good', 'moderate', 'weak'] as Band[]).map(band => ({ band, count: counts[band] }));
}

export interface StudentScore {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  pct: number;
  band: Band;
}

/** One entry per graded student, sorted highest-first - feeds the student comparison bar chart. */
export function getStudentScores(submissions: AnalyticsSubmission[]): StudentScore[] {
  return graded(submissions)
    .map(s => {
      const score = getEffectiveTotalScore(s);
      const pct = s.maxTotal > 0 ? score / s.maxTotal : 0;
      return { studentId: s.studentId, studentName: s.studentName, score, maxScore: s.maxTotal, pct, band: getBand(score, s.maxTotal) };
    })
    .sort((a, b) => b.pct - a.pct);
}

export interface QuestionAverage {
  number: number;
  avgPct: number;
  studentCount: number;
  band: Band;
}

/** Average score (as a %) on each question number, across every student who answered it -
 *  feeds both the question bar chart and the score-trend line. Question number is the finest
 *  real grouping available (no topic tagging), so that's what's used rather than an invented
 *  label. */
export function getQuestionAverages(submissions: AnalyticsSubmission[]): QuestionAverage[] {
  const totals = new Map<number, { sumPct: number; count: number }>();
  graded(submissions).forEach(s => {
    s.result.questions.forEach(q => {
      if (q.maxScore <= 0) return;
      const score = getEffectiveQuestionScore(s, q);
      const entry = totals.get(q.number) ?? { sumPct: 0, count: 0 };
      entry.sumPct += score / q.maxScore;
      entry.count += 1;
      totals.set(q.number, entry);
    });
  });
  return Array.from(totals.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, { sumPct, count }]) => {
      const avgPct = sumPct / count;
      return { number, avgPct, studentCount: count, band: getBand(avgPct, 1) };
    });
}

export interface CriterionAverage {
  code: string;
  name: string;
  avgPct: number;
  sampleCount: number;
}

/** Average score (as a %) per IB criterion code (A/B/C/...), across every question and student
 *  that used it - feeds the radar chart. Criteria are matched by code+name since the same code
 *  can mean different things across coursework types/subjects. */
export function getCriteriaAverages(submissions: AnalyticsSubmission[]): CriterionAverage[] {
  const totals = new Map<string, { name: string; sumPct: number; count: number }>();
  graded(submissions).forEach(s => {
    s.result.questions.forEach(q => {
      q.criteria.forEach(c => {
        if (c.maxScore <= 0) return;
        const key = `${c.code}::${c.name}`;
        const entry = totals.get(key) ?? { name: c.name, sumPct: 0, count: 0 };
        entry.sumPct += c.score / c.maxScore;
        entry.count += 1;
        totals.set(key, entry);
      });
    });
  });
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { name, sumPct, count }]) => ({
      code: key.split('::')[0],
      name,
      avgPct: sumPct / count,
      sampleCount: count
    }));
}

export interface HeatmapCell {
  studentId: string;
  studentName: string;
  questionNumber: number;
  pct: number | null;
}

export interface HeatmapData {
  students: { studentId: string; studentName: string }[];
  questionNumbers: number[];
  cells: HeatmapCell[];
}

/** student x question-number grid of scores (as %) - feeds the heatmap. `pct` is null when
 *  that student's paper didn't include that question number, so the cell renders as "no data"
 *  rather than a fabricated zero. */
export function getHeatmapData(submissions: AnalyticsSubmission[]): HeatmapData {
  const rows = graded(submissions);
  const questionNumbers = Array.from(new Set(rows.flatMap(s => s.result.questions.map(q => q.number)))).sort((a, b) => a - b);
  const students = rows.map(s => ({ studentId: s.studentId, studentName: s.studentName }));

  const cells: HeatmapCell[] = [];
  rows.forEach(s => {
    const byNumber = new Map(s.result.questions.map(q => [q.number, q]));
    questionNumbers.forEach(qn => {
      const q = byNumber.get(qn);
      cells.push({
        studentId: s.studentId,
        studentName: s.studentName,
        questionNumber: qn,
        pct: q && q.maxScore > 0 ? getEffectiveQuestionScore(s, q) / q.maxScore : null
      });
    });
  });

  return { students, questionNumbers, cells };
}

export interface Insight {
  label: string;
  detail: string;
  tone: 'good' | 'weak' | 'neutral';
}

/** A handful of auto-generated, plainly-computed insights (weakest/strongest question, weakest
 *  criterion, papers needing review or failed) - every one is a direct read of the same
 *  aggregates the charts plot, never a separate/invented judgement. */
export function getInsights(submissions: AnalyticsSubmission[]): Insight[] {
  const insights: Insight[] = [];
  if (graded(submissions).length === 0) return insights;

  const questions = getQuestionAverages(submissions);
  if (questions.length > 0) {
    const byWeakest = [...questions].sort((a, b) => a.avgPct - b.avgPct);
    const weakest = byWeakest[0];
    const strongest = byWeakest[byWeakest.length - 1];
    insights.push({
      label: `Question ${weakest.number} is the class's weakest spot`,
      detail: `${Math.round(weakest.avgPct * 100)}% average across ${weakest.studentCount} student${weakest.studentCount === 1 ? '' : 's'} - worth revisiting in class.`,
      tone: 'weak'
    });
    if (strongest.number !== weakest.number) {
      insights.push({
        label: `Question ${strongest.number} is the strongest`,
        detail: `${Math.round(strongest.avgPct * 100)}% average - the class has this one down.`,
        tone: 'good'
      });
    }
  }

  const criteria = getCriteriaAverages(submissions);
  if (criteria.length > 0) {
    const weakest = [...criteria].sort((a, b) => a.avgPct - b.avgPct)[0];
    insights.push({
      label: `${weakest.code} · ${weakest.name} needs the most attention`,
      detail: `${Math.round(weakest.avgPct * 100)}% average across every question that used it.`,
      tone: 'weak'
    });
  }

  const needsReview = submissions.filter(s => s.status === 'NEEDS_REVIEW').length;
  if (needsReview > 0) {
    insights.push({
      label: `${needsReview} paper${needsReview === 1 ? '' : 's'} flagged for review`,
      detail: 'Low OCR confidence or a subject mismatch - check before publishing the grade.',
      tone: 'weak'
    });
  }

  const failed = submissions.filter(s => s.status === 'FAILED').length;
  if (failed > 0) {
    insights.push({
      label: `${failed} paper${failed === 1 ? '' : 's'} failed to grade`,
      detail: 'Retry from the queue, or check the error message for why.',
      tone: 'weak'
    });
  }

  return insights;
}
