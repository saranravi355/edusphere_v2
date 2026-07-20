"use client";

import { Download } from "lucide-react";

type Cell = string | number | boolean | null | undefined;

// Generic client-side CSV export. Pass an array of flat objects; the object
// keys become the column headers. Everything runs in the browser.
export default function ExportButton({
  rows,
  filename,
  label = "Export CSV",
}: {
  rows: Record<string, Cell>[];
  filename: string;
  label?: string;
}) {
  function escapeCell(v: Cell): string {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function exportCsv() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const body = rows.map((r) => headers.map((h) => escapeCell(r[h])).join(","));
    const csv = [headers.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={!rows.length}
      title={rows.length ? `Export ${rows.length} rows to CSV` : "Nothing to export"}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download size={15} /> {label}
    </button>
  );
}
