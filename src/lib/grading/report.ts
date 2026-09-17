import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { getEffectiveTotalScore } from './effectiveScore';
import type { SubmissionRow } from '@/app/(portals)/teacher/grading/ai-grader/types';

export interface SummaryRow {
  studentName: string;
  registrationNo: string;
  subjectName: string;
  title: string;
  term: string;
  status: string;
  effectiveScore: number;
  maxTotal: number;
  scoreRationale: string;
}

function toSummaryRow(s: SubmissionRow): SummaryRow {
  return {
    studentName: s.studentName,
    registrationNo: s.registrationNo,
    subjectName: s.subjectName,
    title: s.title,
    term: s.term,
    status: s.status,
    effectiveScore: getEffectiveTotalScore(s),
    maxTotal: s.result.maxTotal,
    scoreRationale: s.result.scoreRationale || ''
  };
}

// StandardFonts are built into every PDF viewer - no font file to embed, so none of the
// WOFF/WOFF2 glyph-corruption issues seen elsewhere in this codebase's pdf-lib usage apply here.
const MARGIN = 50;
const PAGE_W = 841.89; // A4 landscape - a class list is naturally wide (name, reg no, subject, score...)
const PAGE_H = 595.28;

function wrap(font: import('pdf-lib').PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** One combined class gradesheet: every student in the batch, their score, and a one-line AI
 *  rationale - the "just give me the marks" download for a whole bulk-uploaded assessment. */
export async function buildClassSummaryPdf(className: string, assessmentTitle: string, submissions: SubmissionRow[]): Promise<Uint8Array> {
  const rows = submissions.map(toSummaryRow);
  const doc = await PDFDocument.create();
  doc.setTitle(`${assessmentTitle} — ${className}`);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.06, 0.15, 0.28);
  const grey = rgb(0.4, 0.44, 0.5);
  const line = rgb(0.85, 0.85, 0.85);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const drawHeader = () => {
    page.drawText(assessmentTitle, { x: MARGIN, y: y - 22, size: 20, font: bold, color: ink });
    page.drawText(`${className} — class gradesheet`, { x: MARGIN, y: y - 40, size: 11, font: regular, color: grey });
    y -= 60;
    const cols = [
      { label: 'Student', x: MARGIN, w: 150 },
      { label: 'Reg. No.', x: MARGIN + 155, w: 90 },
      { label: 'Subject', x: MARGIN + 250, w: 120 },
      { label: 'Score', x: MARGIN + 375, w: 60 },
      { label: '%', x: MARGIN + 440, w: 40 },
      { label: 'Why this score', x: MARGIN + 485, w: PAGE_W - MARGIN - (MARGIN + 485) }
    ];
    cols.forEach(c => page.drawText(c.label, { x: c.x, y: y - 10, size: 9, font: bold, color: grey }));
    y -= 18;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: line });
    y -= 14;
    return cols;
  };

  let cols = drawHeader();

  for (const r of rows) {
    const pct = r.maxTotal > 0 ? Math.round((r.effectiveScore / r.maxTotal) * 100) : 0;
    const rationaleLines = r.scoreRationale ? wrap(regular, r.scoreRationale, 8.5, cols[5].w) : ['—'];
    const rowHeight = Math.max(16, rationaleLines.length * 11 + 4);

    if (y - rowHeight < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      cols = drawHeader();
    }

    page.drawText(r.studentName, { x: cols[0].x, y: y - 10, size: 9.5, font: bold, color: ink });
    page.drawText(r.registrationNo, { x: cols[1].x, y: y - 10, size: 9, font: regular, color: grey });
    page.drawText(r.subjectName, { x: cols[2].x, y: y - 10, size: 9, font: regular, color: ink });
    page.drawText(r.maxTotal > 0 ? `${r.effectiveScore}/${r.maxTotal}` : '—', { x: cols[3].x, y: y - 10, size: 9, font: bold, color: ink });
    page.drawText(r.maxTotal > 0 ? `${pct}%` : '—', { x: cols[4].x, y: y - 10, size: 9, font: regular, color: ink });
    rationaleLines.forEach((line_, i) => {
      page.drawText(line_, { x: cols[5].x, y: y - 10 - i * 11, size: 8.5, font: regular, color: grey });
    });

    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_W - MARGIN, y: y + 4 }, thickness: 0.5, color: line });
    y -= 6;
  }

  return doc.save();
}

export async function buildClassSummaryDocx(className: string, assessmentTitle: string, submissions: SubmissionRow[]): Promise<Buffer> {
  const rows = submissions.map(toSummaryRow);
  const headerCells = ['Student', 'Reg. No.', 'Subject', 'Score', '%', 'Why this score'].map(
    h => new TableCell({ shading: { fill: '0F2747' }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })] })] })
  );

  const bodyRows = rows.map(r => {
    const pct = r.maxTotal > 0 ? Math.round((r.effectiveScore / r.maxTotal) * 100) : 0;
    return new TableRow({
      children: [
        new Paragraph({ children: [new TextRun({ text: r.studentName, bold: true, size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: r.registrationNo, size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: r.subjectName, size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: r.maxTotal > 0 ? `${r.effectiveScore}/${r.maxTotal}` : '—', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: r.maxTotal > 0 ? `${pct}%` : '—', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: r.scoreRationale || '—', size: 18 })] })
      ].map(p => new TableCell({ children: [p], margins: { top: 80, bottom: 80, left: 100, right: 100 } }))
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: assessmentTitle, bold: true })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: `${className} — class gradesheet`, italics: true, color: '666666' })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: headerCells }), ...bodyRows]
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

/** One student's full graded sheet: score, AI rationale, general feedback, and every question's
 *  breakdown - the printable/archivable version of what the Overview and (removed) Questions
 *  tabs showed on screen. */
export async function buildIndividualPdf(s: SubmissionRow): Promise<Uint8Array> {
  const r = s.result;
  const effectiveScore = getEffectiveTotalScore(s);
  const doc = await PDFDocument.create();
  doc.setTitle(`${s.title} — ${s.studentName}`);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.06, 0.15, 0.28);
  const grey = rgb(0.4, 0.44, 0.5);
  const brand = rgb(0.92, 0.34, 0.05);

  const W = 595.28, H = 841.89; // A4 portrait - one student, reads like a report card
  let page = doc.addPage([W, H]);
  let y = H - MARGIN;
  const contentW = W - MARGIN * 2;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([W, H]);
      y = H - MARGIN;
    }
  };
  const drawWrapped = (text: string, size: number, font: import('pdf-lib').PDFFont, color: ReturnType<typeof rgb>, lineHeight: number) => {
    for (const line of wrap(font, text, size, contentW)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: MARGIN, y: y - size, size, font, color });
      y -= lineHeight;
    }
  };

  page.drawText(s.title, { x: MARGIN, y: y - 22, size: 20, font: bold, color: ink });
  y -= 30;
  page.drawText(`${s.studentName} (${s.registrationNo}) — ${s.subjectName} — ${s.term}`, { x: MARGIN, y: y - 14, size: 11, font: regular, color: grey });
  y -= 34;

  page.drawText(`Score: ${effectiveScore}/${r.maxTotal}`, { x: MARGIN, y: y - 16, size: 14, font: bold, color: brand });
  y -= 30;

  if (r.scoreRationale) {
    drawWrapped(`Why this score: ${r.scoreRationale}`, 10, regular, grey, 14);
    y -= 10;
  }

  if (r.generalFeedback.length > 0) {
    ensureSpace(16);
    page.drawText('General feedback', { x: MARGIN, y: y - 12, size: 12, font: bold, color: ink });
    y -= 20;
    for (const f of r.generalFeedback) {
      drawWrapped(`•  ${f}`, 10, regular, ink, 14);
    }
    y -= 10;
  }

  for (const q of r.questions) {
    ensureSpace(30);
    page.drawText(`Q${q.number} — ${q.score}/${q.maxScore}`, { x: MARGIN, y: y - 12, size: 11.5, font: bold, color: ink });
    y -= 18;
    if (q.questionText) drawWrapped(q.questionText, 9.5, regular, grey, 13);
    if (q.feedback) drawWrapped(q.feedback, 9.5, regular, ink, 13);
    for (const c of q.criteria) {
      drawWrapped(`${c.code} (${c.name}): ${c.score}/${c.maxScore} — ${c.comment}`, 9, regular, grey, 12);
    }
    y -= 10;
  }

  return doc.save();
}

export async function buildIndividualDocx(s: SubmissionRow): Promise<Buffer> {
  const r = s.result;
  const effectiveScore = getEffectiveTotalScore(s);
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: s.title, bold: true })] }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: `${s.studentName} (${s.registrationNo}) — ${s.subjectName} — ${s.term}`, italics: true, color: '666666' })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: `Score: ${effectiveScore}/${r.maxTotal}`, bold: true, size: 28, color: 'EA580C' })]
    })
  ];

  if (r.scoreRationale) {
    children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Why this score: ', bold: true }), new TextRun({ text: r.scoreRationale })] }));
  }

  if (r.generalFeedback.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'General feedback', bold: true })] }));
    for (const f of r.generalFeedback) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: f })] }));
    }
  }

  for (const q of r.questions) {
    children.push(
      new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `Q${q.number} — ${q.score}/${q.maxScore}`, bold: true })] })
    );
    if (q.questionText) children.push(new Paragraph({ children: [new TextRun({ text: q.questionText, italics: true, color: '666666' })] }));
    if (q.feedback) children.push(new Paragraph({ children: [new TextRun({ text: q.feedback })] }));
    for (const c of q.criteria) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: `${c.code} (${c.name}): `, bold: true }), new TextRun({ text: `${c.score}/${c.maxScore} — ${c.comment}` })]
        })
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
