import type { GradeBoundary } from './types';
import { computeGradeFromBoundaries } from './gradeBoundaries';
import { getEffectiveTotalScore, isScoreOverridden } from './effectiveScore';
import type { ScoredSubmission } from './effectiveScore';

export interface CsvRow extends ScoredSubmission {
  studentName: string;
  registrationNo: string;
  status: string;
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: CsvRow[], gradeBoundaries: GradeBoundary[] = []): string {
  const header = [
    'Student',
    'Registration No.',
    'Status',
    'Detected Subject',
    'Question Count',
    'AI Score',
    'Teacher-Approved Score',
    'Max Score',
    'Percentage',
    'IB Grade',
    'Teacher Feedback'
  ];

  const lines = rows
    .filter(row => row.result !== null)
    .map(row => {
      const r = row.result;
      const isOverridden = isScoreOverridden(row);
      const effectiveScore = getEffectiveTotalScore(row);
      const pct = r.maxTotal > 0 ? effectiveScore / r.maxTotal : 0;
      const grade = computeGradeFromBoundaries(pct, gradeBoundaries);
      return [
        row.studentName,
        row.registrationNo,
        row.status,
        r.detectedSubject,
        String(r.questions.length),
        String(r.totalScore),
        isOverridden ? String(effectiveScore) : '',
        String(r.maxTotal),
        `${Math.round(pct * 100)}%`,
        grade !== null ? String(grade) : '',
        ''
      ]
        .map(csvEscape)
        .join(',');
    });

  return [header.map(csvEscape).join(','), ...lines].join('\r\n');
}
