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
}

/** One OCR'd text line and its pixel bounding box [x1, y1, x2, y2] on its page's image. */
export interface OcrLine {
  text: string;
  box: [number, number, number, number];
}

/** One page of the scanned PDF, rendered by PaddleOCR as a data URL, with its detected lines. */
export interface OcrPage {
  imageDataUrl: string;
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
