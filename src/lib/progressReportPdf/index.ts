import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  SUBJECTS,
  ATL_GROUPS,
  LEARNER_PROFILE,
  UOI_CRITERIA,
  ratingLabel,
  type ProgressReportData,
} from "@/lib/progressReport";

/**
 * Renders a Progress Report to PDF bytes, entirely in memory (no filesystem —
 * this runs inside a server action on Vercel, where only /tmp is writable and
 * a temp file would be needless anyway). Deliberately not a copy of the
 * source paper report's plain sequential Word tables: subjects are grouped
 * cards, ratings are colour-coded chips against the app's own sage/
 * terracotta/gold palette, and there's a one-page "at a glance" summary the
 * paper version doesn't have.
 */

const PAGE_W = 595.28, PAGE_H = 841.89; // A4
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.184, 0.227, 0.231); // #2F3A3D
const MUTED = rgb(0.42, 0.447, 0.475); // #6B7280
const BORDER = rgb(0.898, 0.894, 0.871); // #E5E4DE
const PAPER = rgb(0.973, 0.969, 0.957); // #F8F7F4
const SAGE = rgb(0.369, 0.545, 0.494); // #5E8B7E
const SAGE_D = rgb(0.227, 0.345, 0.314); // #3A5850
const SAGE_L = rgb(0.922, 0.949, 0.941); // #EBF2F0
const TERRA = rgb(0.788, 0.486, 0.365); // #C97C5D
const TERRA_L = rgb(0.976, 0.937, 0.918); // #F9EFEA
const GOLD = rgb(0.914, 0.769, 0.416); // #E9C46A
const GOLD_L = rgb(0.992, 0.976, 0.925); // #FDF9EC
const SUCCESS = rgb(0.282, 0.690, 0.478); // #48B07A
const SUCCESS_L = rgb(0.918, 0.969, 0.941); // #EAF7F0
const GRAY_L = rgb(0.94, 0.94, 0.933);
const WHITE = rgb(1, 1, 1);

const RATING_COLOR: Record<string, { bg: ReturnType<typeof rgb>; fg: ReturnType<typeof rgb> }> = {
  EX: { bg: SUCCESS_L, fg: SUCCESS },
  PF: { bg: SAGE_L, fg: SAGE_D },
  PG: { bg: GOLD_L, fg: rgb(0.55, 0.42, 0.11) },
  EM: { bg: TERRA_L, fg: TERRA },
  AB: { bg: GRAY_L, fg: MUTED },
  "": { bg: GRAY_L, fg: MUTED },
};

function sanitize(s: string): string {
  return String(s ?? "")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[''‚‛]/g, "'")
    .replace(/[""„‟]/g, '"')
    .replace(/[•]/g, "*")
    .replace(/[…]/g, "...")
    .replace(/[^\x00-\xFF]/g, "-");
}

export async function renderProgressReportPdf(input: {
  studentName: string;
  registrationNo: string;
  classroom: string | null;
  academicYear: string;
  term: string;
  grade: string | null;
  data: ProgressReportData;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Progress Report - ${input.studentName} - ${input.term}`);
  doc.setSubject(`${input.academicYear} progress report`);

  const F = await doc.embedFont(StandardFonts.Helvetica);
  const FB = await doc.embedFont(StandardFonts.HelveticaBold);
  const FI = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page!: PDFPage;
  let y = 0;

  function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = sanitize(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function addPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  addPage();

  function ensureSpace(h: number) {
    if (y - h < MARGIN + 20) addPage();
  }

  function para(t: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; leading?: number; gapAfter?: number; maxWidth?: number; x?: number; indent?: number } = {}) {
    const { size = 10, font = F, color = INK, leading = 14, gapAfter = 8, indent = 0 } = opts;
    const x = MARGIN + indent;
    const maxWidth = (opts.maxWidth ?? CONTENT_W) - indent;
    const lines = wrapText(t, font, size, maxWidth);
    for (const line of lines) {
      ensureSpace(leading);
      page.drawText(line, { x, y, size, font, color });
      y -= leading;
    }
    y -= gapAfter;
  }

  function sectionHeader(title: string) {
    ensureSpace(40);
    page.drawRectangle({ x: MARGIN, y: y - 26, width: CONTENT_W, height: 26, color: SAGE });
    page.drawText(sanitize(title), { x: MARGIN + 12, y: y - 18, size: 12.5, font: FB, color: WHITE });
    y -= 26 + 14;
  }

  function chip(label: string, x: number, chipY: number, colorSet: { bg: ReturnType<typeof rgb>; fg: ReturnType<typeof rgb> }) {
    const w = FB.widthOfTextAtSize(label, 8.5) + 14;
    page.drawRectangle({ x, y: chipY, width: w, height: 15, color: colorSet.bg });
    page.drawText(label, { x: x + 7, y: chipY + 4, size: 8.5, font: FB, color: colorSet.fg });
    return w;
  }

  function ratingRow(label: string, rating: string) {
    ensureSpace(17);
    const c = RATING_COLOR[rating] ?? RATING_COLOR[""];
    const chipLabel = rating || "—";
    const chipW = FB.widthOfTextAtSize(chipLabel, 8.5) + 14;
    const chipX = MARGIN + CONTENT_W - chipW;
    const lines = wrapText(label, F, 9.7, CONTENT_W - chipW - 10);
    lines.forEach((line, i) => {
      if (i > 0) ensureSpace(13);
      page.drawText(line, { x: MARGIN, y: y - (i === 0 ? 3 : 0), size: 9.7, font: F, color: INK });
      if (i < lines.length - 1) y -= 13;
    });
    chip(chipLabel, chipX, y - 4, c);
    y -= 17;
  }

  function card(height: number) {
    ensureSpace(height);
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: WHITE, borderColor: BORDER, borderWidth: 1 });
  }

  // ---------------------------------------------------------------------
  // Cover
  // ---------------------------------------------------------------------
  page.drawRectangle({ x: 0, y: PAGE_H - 130, width: PAGE_W, height: 130, color: SAGE_D });
  page.drawText("EduSphere 360", { x: MARGIN, y: PAGE_H - 44, size: 13, font: FB, color: rgb(0.85, 0.91, 0.88) });
  page.drawText("Progress Report", { x: MARGIN, y: PAGE_H - 80, size: 26, font: FB, color: WHITE });
  page.drawText(`${input.term}  .  ${input.academicYear}${input.grade ? `  .  ${input.grade}` : ""}`, { x: MARGIN, y: PAGE_H - 104, size: 11.5, font: F, color: rgb(0.85, 0.91, 0.88) });
  y = PAGE_H - 130 - 30;

  card(90);
  const infoY = y - 22;
  const rows: [string, string][] = [
    ["Student", input.studentName],
    ["Registration No.", input.registrationNo],
    ["Class", input.classroom ?? "-"],
    ["Homeroom Teacher", input.data.homeroomTeacherName || "-"],
  ];
  rows.forEach(([k, v], i) => {
    const colX = MARGIN + 20 + (i % 2) * (CONTENT_W / 2);
    const rowY = infoY - Math.floor(i / 2) * 30;
    page.drawText(sanitize(k).toUpperCase(), { x: colX, y: rowY, size: 7.5, font: FB, color: MUTED });
    page.drawText(sanitize(v), { x: colX, y: rowY - 14, size: 11, font: FB, color: INK });
  });
  y -= 90 + 20;

  if (input.data.introLetter) {
    para(input.data.introLetter, { size: 10.2, leading: 14.5, color: rgb(0.35, 0.38, 0.4) });
  }

  // At-a-glance subject snapshot
  const withOverall = SUBJECTS.filter((s) => input.data.subjects[s.key]?.overall);
  if (withOverall.length) {
    sectionHeader("At a Glance — Subject Overview");
    let cx = MARGIN, rowMaxH = 0;
    const cardW = (CONTENT_W - 12 * 2) / 3;
    withOverall.forEach((s, i) => {
      if (i % 3 === 0 && i > 0) { y -= rowMaxH + 10; cx = MARGIN; rowMaxH = 0; }
      ensureSpace(50);
      const overall = input.data.subjects[s.key].overall;
      const c = RATING_COLOR[overall] ?? RATING_COLOR[""];
      page.drawRectangle({ x: cx, y: y - 44, width: cardW, height: 44, color: c.bg });
      page.drawText(sanitize(s.name), { x: cx + 10, y: y - 18, size: 9.5, font: FB, color: INK });
      page.drawText(overall, { x: cx + 10, y: y - 34, size: 13, font: FB, color: c.fg });
      page.drawText(ratingLabel(overall), { x: cx + 30, y: y - 33, size: 8.5, font: F, color: c.fg });
      cx += cardW + 12;
      rowMaxH = 44;
    });
    y -= rowMaxH + 14;
  }

  // ---------------------------------------------------------------------
  // Units of Inquiry
  // ---------------------------------------------------------------------
  const hasAnyUnit = input.data.unitsOfInquiry.some((u) => u.theme || u.centralIdea || u.comment || u.ratings.some((r) => r));
  if (hasAnyUnit) {
    addPage();
    sectionHeader("Progress Summary — Units of Inquiry");
  }
  input.data.unitsOfInquiry.forEach((u, i) => {
    if (!u.theme && !u.centralIdea && !u.comment && u.ratings.every((r) => !r)) return;
    ensureSpace(60);
    page.drawText(sanitize(`Unit of Inquiry ${i + 1}${u.theme ? ` — ${u.theme}` : ""}`), { x: MARGIN, y, size: 12, font: FB, color: SAGE_D });
    y -= 16;
    if (u.centralIdea) {
      para(`Central Idea: ${u.centralIdea}`, { size: 9.7, font: FI, color: MUTED, leading: 13, gapAfter: 4 });
    }
    if (u.inquiryPoints.length) {
      para("An inquiry into:", { size: 9.3, font: FB, color: INK, leading: 12, gapAfter: 2 });
      u.inquiryPoints.forEach((p) => para(`•  ${p}`, { size: 9.3, leading: 12.5, gapAfter: 2, indent: 6 }));
      y -= 4;
    }
    UOI_CRITERIA.forEach((crit, ci) => ratingRow(crit, u.ratings[ci] ?? ""));
    if (u.comment) {
      ensureSpace(20);
      y -= 4;
      const lines = wrapText(u.comment, F, 9.3, CONTENT_W - 20);
      const boxH = lines.length * 12.5 + 20;
      ensureSpace(boxH);
      page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: PAPER, borderColor: BORDER, borderWidth: 1 });
      page.drawText("TEACHER'S COMMENT", { x: MARGIN + 10, y: y - 13, size: 7.5, font: FB, color: SAGE_D });
      let ly = y - 26;
      lines.forEach((l) => { page.drawText(l, { x: MARGIN + 10, y: ly, size: 9.3, font: F, color: INK }); ly -= 12.5; });
      y -= boxH + 6;
    }
    y -= 12;
  });

  // ---------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------
  for (const s of SUBJECTS) {
    const ans = input.data.subjects[s.key];
    if (!ans) continue;
    const hasContent = ans.itemRatings.some((r) => r) || ans.overall || ans.comment;
    if (!hasContent) continue;

    addPage();
    sectionHeader(s.name);
    let idx = 0;
    for (const strand of s.strands) {
      if (strand.name) {
        ensureSpace(16);
        page.drawText(sanitize(strand.name), { x: MARGIN, y, size: 10, font: FB, color: TERRA });
        y -= 15;
      }
      for (const item of strand.items) {
        ratingRow(item, ans.itemRatings[idx] ?? "");
        idx++;
      }
      y -= 4;
    }
    if (ans.overall) {
      ensureSpace(26);
      const c = RATING_COLOR[ans.overall] ?? RATING_COLOR[""];
      page.drawRectangle({ x: MARGIN, y: y - 22, width: CONTENT_W, height: 22, color: c.bg });
      page.drawText(`Overall Performance in ${s.name}`, { x: MARGIN + 10, y: y - 15, size: 9.7, font: FB, color: INK });
      page.drawText(ans.overall, { x: MARGIN + CONTENT_W - 40, y: y - 15, size: 10.5, font: FB, color: c.fg });
      y -= 22 + 10;
    }
    if (ans.comment) {
      const lines = wrapText(ans.comment, F, 9.3, CONTENT_W - 20);
      const boxH = lines.length * 12.5 + 20;
      ensureSpace(boxH);
      page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: PAPER, borderColor: BORDER, borderWidth: 1 });
      page.drawText("TEACHER'S COMMENT", { x: MARGIN + 10, y: y - 13, size: 7.5, font: FB, color: SAGE_D });
      let ly = y - 26;
      lines.forEach((l) => { page.drawText(l, { x: MARGIN + 10, y: ly, size: 9.3, font: F, color: INK }); ly -= 12.5; });
      y -= boxH + 6;
    }
  }

  // ---------------------------------------------------------------------
  // Approaches to Learning
  // ---------------------------------------------------------------------
  const hasAnyAtl = ATL_GROUPS.some((g) => (input.data.atl[g.name] ?? []).some((r) => r));
  if (hasAnyAtl) {
    addPage();
    sectionHeader("Progress Summary — Approaches to Learning");
  }
  for (const g of ATL_GROUPS) {
    const ratings = input.data.atl[g.name] ?? [];
    if (!ratings.some((r) => r)) continue;
    ensureSpace(16);
    page.drawText(sanitize(g.name), { x: MARGIN, y, size: 10, font: FB, color: TERRA });
    y -= 15;
    g.items.forEach((item, i) => ratingRow(item, ratings[i] ?? ""));
    y -= 4;
  }

  // ---------------------------------------------------------------------
  // Learner Profile
  // ---------------------------------------------------------------------
  const lpEntries = LEARNER_PROFILE.filter((p) => input.data.learnerProfile[p.name]);
  if (lpEntries.length) {
    y -= 8;
    sectionHeader("Progress Summary — IB Learner Profile");
    let cx = MARGIN, rowMaxH = 0;
    const cardW = (CONTENT_W - 12 * 4) / 5;
    lpEntries.forEach((p, i) => {
      if (i % 5 === 0 && i > 0) { y -= rowMaxH + 10; cx = MARGIN; rowMaxH = 0; }
      ensureSpace(50);
      const rating = input.data.learnerProfile[p.name];
      const c = RATING_COLOR[rating] ?? RATING_COLOR[""];
      page.drawRectangle({ x: cx, y: y - 44, width: cardW, height: 44, color: c.bg });
      const nameLines = wrapText(p.name, FB, 8, cardW - 12);
      page.drawText(nameLines[0] ?? "", { x: cx + 8, y: y - 16, size: 8, font: FB, color: INK });
      page.drawText(rating, { x: cx + 8, y: y - 32, size: 12, font: FB, color: c.fg });
      cx += cardW + 12;
      rowMaxH = 44;
    });
    y -= rowMaxH + 10;
  }

  // ---------------------------------------------------------------------
  // Books read + signatures
  // ---------------------------------------------------------------------
  if (input.data.booksRead.length) {
    y -= 10;
    sectionHeader("Books Read This Term");
    input.data.booksRead.forEach((b) => para(`•  ${b}`, { size: 9.7, leading: 14, gapAfter: 3 }));
  }

  ensureSpace(80);
  y -= 20;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.6, color: BORDER });
  y -= 40;
  const sigW = CONTENT_W / 2 - 20;
  [["Homeroom Teacher", input.data.homeroomTeacherName || ""], ["Parent / Guardian", ""]].forEach(([label], i) => {
    const sx = MARGIN + i * (sigW + 40);
    page.drawLine({ start: { x: sx, y }, end: { x: sx + sigW, y }, thickness: 0.8, color: MUTED });
    page.drawText(sanitize(label), { x: sx, y: y - 14, size: 9, font: F, color: MUTED });
  });

  return doc.save();
}
