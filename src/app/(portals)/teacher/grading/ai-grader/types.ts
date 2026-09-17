import type { GradingResult, OcrPage } from '@/lib/grading/types';

/** What page.tsx passes down to the client — a serialized AIGradingSubmission row (Prisma's
 *  Json columns come through as `unknown`; we know their real shape from what actions.ts
 *  writes into them). */
export interface SubmissionRow {
  id: string;
  // Null when a bulk-uploaded sheet hasn't been matched to a student yet (see bulkActions.ts) -
  // studentName/registrationNo below read as "Unassigned" in that case rather than a real name.
  studentId: string | null;
  studentName: string;
  registrationNo: string;
  originalFileName: string | null;
  batchId: string | null;
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
