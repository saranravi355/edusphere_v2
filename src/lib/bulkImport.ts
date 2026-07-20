// Shared types + helpers for the reusable bulk-import wizard and CSV export.

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[]; // normalized header aliases used for auto-mapping
  email?: boolean;
  numeric?: boolean;
  enumValues?: string[]; // value must be one of these (case-insensitive)
  uniqueInFile?: boolean; // flag duplicates within the uploaded file
};

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
