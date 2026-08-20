// Shared types + helpers for the reusable bulk-import wizard and CSV export.

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[]; // normalized header aliases used for auto-mapping
  email?: boolean;
  numeric?: boolean;
  enumValues?: string[]; // value must be one of these (case-insensitive)
  /**
   * Like enumValues, but for a list resolved at runtime — the classrooms that
   * actually exist, say. Kept separate because the message differs: an enum is
   * "must be PYP/MYP/DP", this is "there is no class called 8Z here".
   */
  oneOf?: string[];
  /**
   * A soft format check. Held as a string rather than a RegExp because these
   * definitions are built in Server Components and handed to a Client
   * Component, and a RegExp is not serialisable across that boundary.
   */
  pattern?: { source: string; flags?: string; message: string; level?: "warn" | "error" };
  /** Warn when the value does not look like a date a human or Date() can read. */
  date?: boolean;
  uniqueInFile?: boolean; // flag duplicates within the uploaded file
};

/** Limits shared by every importer. See BulkImportWizard for why each exists. */
export const IMPORT_LIMITS = {
  /** Above this the browser tab, not the server, is what falls over. */
  maxFileBytes: 15 * 1024 * 1024,
  /** Rows are sent to a Server Action in one payload; see next.config.ts. */
  maxRows: 5000,
  /** Rows rendered in the review step. The rest are still imported. */
  previewRows: 200,
} as const;

export const IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv", ".tsv"] as const;

/** True when the string parses as a date, including dd/mm/yyyy which Date() rejects. */
export function looksLikeDate(v: string): boolean {
  if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(v.trim())) return true;
  return !isNaN(new Date(v).getTime());
}

export type ImportRow = Record<string, string | undefined>;

export type ImportResult = {
  created: number;
  skipped: number;
  failed: number;
  messages: { row: number; status: "created" | "skipped" | "failed"; detail: string }[];
};

export function cleanValue(v: string | undefined | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const t = String(v).trim();
  return t.length ? t : undefined;
}

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
