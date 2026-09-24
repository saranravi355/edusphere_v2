export type Level = 'SL' | 'HL';

export type CourseworkType = 'internal-assessment' | 'extended-essay' | 'tok' | 'external-assessment' | 'exam';

export const COURSEWORK_TYPE_LABELS: Record<CourseworkType, string> = {
  'internal-assessment': 'Internal Assessment',
  'extended-essay': 'Extended Essay',
  tok: 'TOK essay/exhibition',
  'external-assessment': 'External Assessment',
  exam: 'Exam'
};

export type IBProgramme = 'DP' | 'MYP';

export const IB_PROGRAMME_LABELS: Record<IBProgramme, string> = {
  DP: 'Diploma Programme (DP)',
  MYP: 'Middle Years Programme (MYP)'
};

export interface CriterionScore {
  code: string;
  name: string;
  score: number;
  maxScore: number;
  comment: string;
  /** What in the student's answer earned the awarded marks for this criterion - cited from
   *  their actual answer, not invented. Empty string if the model didn't identify anything. */
  evidence: string;
  /** What's missing, wrong, or incomplete for this criterion. Empty string if full marks
   *  were awarded and nothing is missing. */
  missing: string;
}

export interface GradedQuestion {
  number: number;
  questionText: string;
  answerText: string;
  score: number;
  maxScore: number;
  feedback: string;
  criteria: CriterionScore[];
  /** The model's own confidence (0-1) in its grading of this question, accounting for OCR
   *  clarity and answer ambiguity. Null when the model didn't report one - never fabricated. */
  confidence: number | null;
}

export type AnnotationType = 'strength' | 'weakness' | 'suggestion' | 'criterion';

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  strength: 'Strength',
  weakness: 'Weakness',
  suggestion: 'Suggestion',
  criterion: 'Criterion'
};

export interface Annotation {
  type: AnnotationType;
  criterionCode?: string;
  /** Which question this annotation belongs to, so the awarded raw marks for its criterion
   *  can be resolved and shown alongside the highlight. Undefined for holistic pieces
   *  (Extended Essay/TOK) where there's only ever one synthetic question. */
  questionNumber?: number;
  lineStart: number;
  lineEnd: number;
  comment: string;
}

export interface GradingResult {
  questions: GradedQuestion[];
  generalFeedback: string[];
  totalScore: number;
  maxTotal: number;
  error?: string;
  detectedSubject: string;
  annotations: Annotation[];
  /** A short (2-3 sentence) plain-language explanation of why the AI arrived at totalScore -
   *  what pulled the score up or down across the criteria - shown next to the teacher's
   *  override control so a teacher can sanity-check the number before approving it. Empty
   *  string if the model didn't report one (e.g. the empty/garbled-sheet result). */
  scoreRationale: string;
}

/** One line of a page's OCR'd text (from PaddleOCR-VL-1.6's markdown output). Earlier this also
 *  carried a pixel bounding box from the older PP-OCRv6 model, used to overlay annotation
 *  highlights directly on the scanned page image - PaddleOCR-VL-1.6's markdown-based response
 *  has no per-line position data, so that overlay is no longer possible (see AnnotatedTab in
 *  SubmissionReport.tsx, which highlights matched lines as text instead). */
export interface OcrLine {
  text: string;
}

/** One page of extracted answer-sheet text, however it was obtained: OCR'd by PaddleOCR for a
 *  scanned PDF or photo, or read directly from a Word document or plain-text file (see
 *  extractText.ts) - the rest of the grading pipeline treats every source the same way.
 *  Text only: rows graded before Sep 2026 may still carry a legacy base64 imageDataUrl in the
 *  stored JSON, which page.tsx strips before anything reaches the browser. */
export interface OcrPage {
  lines: OcrLine[];
}

/** One point on a 1-7 grade-boundary scale: "a percentage of at least minPercent earns this
 *  grade". Real IB grade boundaries are set per subject/session and are NOT a fixed formula -
 *  this app never invents them. A grade is only ever shown when a teacher has entered real
 *  boundaries for this class here; otherwise only the raw score/percentage is shown. */
export interface GradeBoundary {
  grade: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  minPercent: number;
}
