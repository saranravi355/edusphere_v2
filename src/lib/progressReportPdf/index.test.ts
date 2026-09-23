import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { renderProgressReportPdf } from "./index";
import { emptyProgressReportData } from "@/lib/progressReport";

/**
 * academicYear and grade are free <input> fields on the new-report form, not a <select> -
 * a teacher can paste in text with a non-breaking hyphen (Word/Outlook autocorrect commonly
 * turns a typed "-" into one inside a date range like "2026-2027"). pdf-lib's StandardFonts
 * only encode WinAnsi and throw on anything outside it, so this used to fail the whole PDF
 * with "Could not build the PDF: WinAnsi cannot encode..." - the same character class that
 * broke the AI grader's report.ts earlier this session, just in a different file that didn't
 * get that fix.
 */
const NB_HYPHEN = "‑";

const isPdf = (bytes: Uint8Array) => Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-";

function baseInput(over: Partial<Parameters<typeof renderProgressReportPdf>[0]> = {}) {
  return {
    studentName: "Aarav Patel",
    registrationNo: "STU-2026-001",
    classroom: "PYP4A",
    academicYear: "2026-2027",
    term: "Term 1",
    grade: "Grade 4",
    data: emptyProgressReportData(),
    ...over
  };
}

describe("renderProgressReportPdf", () => {
  it("builds a PDF with plain ASCII fields", async () => {
    const bytes = await renderProgressReportPdf(baseInput());
    assert.ok(isPdf(bytes));
  });

  it("builds a PDF when academicYear has a non-breaking hyphen instead of a plain one", async () => {
    const bytes = await renderProgressReportPdf(baseInput({ academicYear: `2026${NB_HYPHEN}2027` }));
    assert.ok(isPdf(bytes));
  });

  it("builds a PDF when grade has a non-breaking hyphen", async () => {
    const bytes = await renderProgressReportPdf(baseInput({ grade: `Grade 4${NB_HYPHEN}A` }));
    assert.ok(isPdf(bytes));
  });
});
