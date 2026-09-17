import type { Annotation, GradedQuestion, OcrPage } from './types';

export interface LineMark {
  key: string;
  /** Shared by every line belonging to the same annotation on the same page, so grouping
   *  behavior (hover state on-screen) can act together. */
  groupKey: string;
  annotationIndex: number;
  annotation: Annotation;
  isFirstInGroup: boolean;
  /** Index of this line within its page's `lines` array. */
  lineIndex: number;
}

/** Resolves an annotation back to the actual raw marks it's about, via questionNumber +
 *  criterionCode - so a highlight can show real numbers, not just a reaction. */
export function resolveMark(annotation: Annotation, questions: GradedQuestion[]): { score: number; maxScore: number } | null {
  if (!annotation.criterionCode) return null;
  const question =
    annotation.questionNumber !== undefined ? questions.find(q => q.number === annotation.questionNumber) : questions[0];
  const criterion = question?.criteria.find(c => c.code === annotation.criterionCode);
  return criterion ? { score: criterion.score, maxScore: criterion.maxScore } : null;
}

/** Assigns each line across all pages the same global index buildLineMarkedText used
 *  ([L0], [L1], ...), so annotation.lineStart/lineEnd can be resolved back to (page, line)
 *  without needing to re-run any matching. Marks are computed PER LINE (never merged into one
 *  span covering multiple lines) so each one hugs its own real text tightly.
 *
 *  PaddleOCR-VL-1.6 (see ocr.ts) reports OCR'd text as markdown with no per-line pixel position,
 *  unlike the older PP-OCRv6 model this used to run on - so, unlike before, this can no longer
 *  place a highlight box at an (x, y) position on a rendered page image. Instead it returns
 *  which OCR line(s) on which page each annotation covers, and the caller (AnnotatedTab in
 *  SubmissionReport.tsx) highlights that line's actual text inline. */
export function computePageMarks(pages: OcrPage[], annotations: Annotation[]): LineMark[][] {
  const perPage: LineMark[][] = pages.map(() => []);
  let globalIndex = 0;
  const lineLocation: { pageIndex: number; lineIndex: number }[] = [];
  pages.forEach((page, pageIndex) => {
    page.lines.forEach((_, lineIndex) => {
      lineLocation[globalIndex] = { pageIndex, lineIndex };
      globalIndex++;
    });
  });

  annotations.forEach((annotation, annotationIndex) => {
    const lo = Math.min(annotation.lineStart, annotation.lineEnd);
    const hi = Math.max(annotation.lineStart, annotation.lineEnd);

    const byPage = new Map<number, number[]>();
    for (let i = lo; i <= hi; i++) {
      const loc = lineLocation[i];
      if (!loc) continue;
      if (!byPage.has(loc.pageIndex)) byPage.set(loc.pageIndex, []);
      byPage.get(loc.pageIndex)!.push(loc.lineIndex);
    }

    byPage.forEach((lineIndices, pageIndex) => {
      const groupKey = `${annotationIndex}-${pageIndex}`;
      const sorted = [...lineIndices].sort((a, b) => a - b);
      sorted.forEach((lineIndex, idx) => {
        perPage[pageIndex].push({
          key: `${groupKey}-${lineIndex}`,
          groupKey,
          annotationIndex,
          annotation,
          isFirstInGroup: idx === 0,
          lineIndex,
        });
      });
    });
  });

  return perPage;
}
