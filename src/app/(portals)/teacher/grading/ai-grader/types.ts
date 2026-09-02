import type { GradingResult, OcrPage } from '@/lib/grading/types';

/** What page.tsx passes down to the client — a serialized AIGradingSubmission row (Prisma's
 *  Json columns come through as `unknown`; we know their real shape from what actions.ts
 *  writes into them). */
export interface SubmissionRow {
  id: string;
  studentId: string;
  studentName: string;
  registrationNo: string;
  subjectName: string;
  title: string;
  term: string;
  programme: string;
  status: string;
  errorMessage: string | null;
  totalScore: number;
  maxTotal: number;
  teacherOverrideScore: number | null;
  teacherOverrideQuestionScores: Record<number, number> | null;
  teacherFeedback: string | null;
  result: GradingResult;
  ocrText: string | null;
  ocrPages: OcrPage[] | null;
  ocrConfidence: number | null;
  fileUrl: string;
  createdAt: string;
}
