"use client";

import { Download } from "lucide-react";
import { toCsv, downloadCsv, type Cell } from "@/lib/csv";

/**
 * Generic client-side CSV export. Pass an array of flat objects; the object
 * keys become the column headers. Everything runs in the browser.
 *
 * Escaping, the UTF-8 BOM and the formula-injection guard all live in
 * @/lib/csv so every export in the app produces identical bytes.
 */
export default function ExportButton({
  rows,
  filename,
  label = "Export CSV",
  headers,
}: {
  rows: Record<string, Cell>[];
  filename: string;
  label?: string;
  /** Column order and header text. Defaults to the keys of the first row. */
  headers?: string[];
}) {
  function exportCsv() {
    if (!rows.length) return;
    downloadCsv(filename, toCsv(rows, headers));
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={!rows.length}
      title={rows.length ? `Export ${rows.length} rows to CSV` : "Nothing to export"}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
    >
      <Download size={15} aria-hidden /> {label}
    </button>
  );
}
