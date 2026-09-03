import { buildSubjectDetectionPrompt, buildTextGradingPrompt } from './prompt';
import { parseGradingResponse } from './parseGradingResponse';
import { SUBJECTS, GENERAL_SUBJECT } from './subjects';
import { callWithFailover } from '../ai/pool';
import type { CourseworkType, GradingResult, IBProgramme } from './types';

const TOK_SUBJECT_LABEL = 'Theory of Knowledge';
const DETECTABLE_SUBJECTS = SUBJECTS.filter(s => s !== GENERAL_SUBJECT);

function normalizeDetectedSubject(raw: string): string {
  const cleaned = raw.trim().replace(/^["'.\s]+|["'.\s]+$/g, '');
  const match = SUBJECTS.find(s => s.toLowerCase() === cleaned.toLowerCase());
  return match ?? GENERAL_SUBJECT;
}

function mismatchResult(selectedSubject: string, detectedSubject: string): GradingResult {
  return {
    questions: [],
    generalFeedback: [],
    totalScore: 0,
    maxTotal: 0,
    detectedSubject,
    annotations: [],
    error: `Subject mismatch: this sheet looks like a ${detectedSubject} paper, but ${selectedSubject} was selected. Re-upload with the correct subject selected, or choose "${GENERAL_SUBJECT}" to grade it anyway.`
  };
}

/** Grades OCR'd answer-sheet text against the given subject/level/programme/coursework type,
 *  including the subject-mismatch safety check. Ported from the standalone grader's
 *  /api/grade route, with the same behavior: TOK skips subject verification entirely (it has
 *  no subject concept), and picking "General / Other" also skips it (nothing to mismatch
 *  against). Throws on a genuine grading failure; a subject mismatch is a normal return value
 *  (GradingResult.error set, zero score) rather than a thrown error, matching the original. */
export async function gradeAnswerSheet(params: {
  ocrText: string;
  subject: string;
  level: string;
  courseworkType: CourseworkType;
  programme: IBProgramme;
}): Promise<GradingResult> {
  const { ocrText, subject, level, courseworkType, programme } = params;

  if (courseworkType === 'tok') {
    const gradingPrompt = buildTextGradingPrompt(programme, courseworkType, TOK_SUBJECT_LABEL, level || '', ocrText);
    const text = (await callWithFailover(gradingPrompt, true)).text;
    return parseGradingResponse(text, TOK_SUBJECT_LABEL);
  }

  const selectedSubject = SUBJECTS.includes(subject) ? subject : GENERAL_SUBJECT;

  let detectedSubject = selectedSubject;
  if (selectedSubject !== GENERAL_SUBJECT) {
    try {
      const detectionPrompt = buildSubjectDetectionPrompt(ocrText, DETECTABLE_SUBJECTS);
      const rawDetected = (await callWithFailover(detectionPrompt, false)).text;
      detectedSubject = normalizeDetectedSubject(rawDetected);
    } catch {
      detectedSubject = selectedSubject;
    }

    if (detectedSubject !== GENERAL_SUBJECT && detectedSubject !== selectedSubject) {
      return mismatchResult(selectedSubject, detectedSubject);
    }
  }

  const gradingPrompt = buildTextGradingPrompt(programme, courseworkType, selectedSubject, level, ocrText);
  const text = (await callWithFailover(gradingPrompt, true)).text;
  return parseGradingResponse(text, selectedSubject);
}

/** Prefixes every OCR'd line with a global [L#] marker so the grading model can reference
 *  exactly which line(s) an annotation applies to (see annotationLayout.ts) without needing
 *  fuzzy text matching to re-locate it afterwards. Same page-separator convention as the
 *  standalone grader (`\n\n---\n\n`), since the grading prompt was tuned against that shape. */
export function buildMarkedOcrText(pages: { lines: { text: string }[] }[]): string {
  let index = 0;
  const pageBlocks = pages.map(page => page.lines.map(line => `[L${index++}] ${line.text}`).join('\n'));
  return pageBlocks.join('\n\n---\n\n');
}
