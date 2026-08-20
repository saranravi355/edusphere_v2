"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  XCircle, ArrowRight, ArrowLeft, Loader2, Sparkles,
} from "lucide-react";
import type { FieldDef, ImportRow, ImportResult } from "@/lib/bulkImport";
import { normalizeHeader, looksLikeDate, IMPORT_LIMITS, IMPORT_EXTENSIONS } from "@/lib/bulkImport";

type RowStatus = "ok" | "warn" | "error";
type ValidatedRow = { index: number; values: ImportRow; status: RowStatus; notes: string[] };

export default function BulkImportWizard({
  entityLabel,
  fields,
  templateExample,
  templateFileName,
  primaryKeys,
  importAction,
}: {
  entityLabel: string; // e.g. "teachers"
  fields: FieldDef[];
  templateExample: string[]; // one example row, aligned to `fields`
  templateFileName: string;
  primaryKeys: string[]; // field keys shown in the preview table
  importAction: (rows: ImportRow[]) => Promise<ImportResult>;
}) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [truncatedFrom, setTruncatedFrom] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const requiredKeys = fields.filter((f) => f.required).map((f) => f.key);

  function autoMap(hdrs: string[]) {
    const map: Record<string, number> = {};
    for (const f of fields) {
      // The field's own label counts as an alias. Without this, downloading the
      // template and uploading it back failed to map any field whose label was
      // not also listed by hand — "Class / Section" normalises to
      // "classsection", which was in no alias list, so the class column was
      // silently dropped on a round trip of the app's own template.
      const names = new Set([...f.aliases, normalizeHeader(f.label)]);
      map[f.key] = hdrs.findIndex((h) => names.has(normalizeHeader(h)));
    }
    setMapping(map);
  }

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setCommitError(null);
    setTruncatedFrom(null);

    // Drag-and-drop bypasses the input's accept attribute entirely, so the
    // check has to happen here rather than being left to the file picker.
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!(IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
      setParseError(`${file.name} is not a spreadsheet. Use ${IMPORT_EXTENSIONS.join(", ")}.`);
      return;
    }

    // The whole file is read into memory and parsed synchronously on the main
    // thread. Past roughly this size the tab stops responding, which reads as
    // "the app crashed" rather than "that file is too big".
    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
      setParseError(`${file.name} is ${mb(file.size)}. The limit is ${mb(IMPORT_LIMITS.maxFileBytes)} — split it into smaller files.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setParseError(`Could not read ${file.name}. If it is open in Excel, close it and try again.`);
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) { setParseError("That workbook has no sheets in it."); return; }
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, raw: false, defval: "" });
        if (!rows.length) { setParseError("The file appears to be empty."); return; }
        const hdrs = rows[0].map((h) => String(h ?? "").trim());
        if (!hdrs.some((h) => h.length)) { setParseError("The first row must contain column headers."); return; }
        let body = rows.slice(1).filter((r) => r.some((c) => String(c ?? "").trim().length));
        if (!body.length) { setParseError("The file has headers but no data rows."); return; }

        // Every importable row travels to the Server Action in a single
        // payload. Beyond this the request is rejected by the body size limit
        // and the failure surfaces as an unexplained error at the last step,
        // after the person has already done the mapping work.
        if (body.length > IMPORT_LIMITS.maxRows) {
          setTruncatedFrom(body.length);
          body = body.slice(0, IMPORT_LIMITS.maxRows);
        }

        setHeaders(hdrs);
        setDataRows(body.map((r) => hdrs.map((_, i) => String(r[i] ?? "").trim())));
        setFileName(file.name);
        autoMap(hdrs);
        setStep(2);
      } catch {
        setParseError("Could not read that file. Please upload a valid .xlsx, .xls or .csv file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([fields.map((f) => f.label), templateExample]);
    ws["!cols"] = fields.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entityLabel);
    XLSX.writeFile(wb, templateFileName);
  }

  function mapRow(row: string[]): ImportRow {
    const obj: ImportRow = {};
    for (const f of fields) {
      const idx = mapping[f.key];
      if (idx !== undefined && idx >= 0) {
        const v = row[idx]?.trim();
        if (v) obj[f.key] = v;
      }
    }
    return obj;
  }

  const validated: ValidatedRow[] = useMemo(() => {
    const seen: Record<string, Set<string>> = {};
    return dataRows.map((row, i) => {
      const values = mapRow(row);
      const notes: string[] = [];
      let status: RowStatus = "ok";
      for (const f of fields) {
        const v = values[f.key];
        if (f.required && !v) { status = "error"; notes.push(`Missing ${f.label}`); continue; }
        if (!v) continue;
        if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { status = "error"; notes.push(`Invalid ${f.label}`); }
        if (f.numeric && isNaN(Number(v))) { if (status === "ok") status = "warn"; notes.push(`${f.label} not a number`); }
        if (f.enumValues && !f.enumValues.map((x) => x.toLowerCase()).includes(v.toLowerCase())) {
          status = "error"; notes.push(`${f.label} must be one of ${f.enumValues.join("/")}`);
        }
        if (f.oneOf && !f.oneOf.map((x) => x.trim().toLowerCase()).includes(v.toLowerCase())) {
          status = "error"; notes.push(`Unknown ${f.label} "${v}"`);
        }
        if (f.date && !looksLikeDate(v)) { if (status === "ok") status = "warn"; notes.push(`Unreadable ${f.label}`); }
        if (f.pattern && !new RegExp(f.pattern.source, f.pattern.flags).test(v)) {
          if (f.pattern.level === "error") status = "error";
          else if (status === "ok") status = "warn";
          notes.push(f.pattern.message);
        }
        if (f.uniqueInFile) {
          const set = (seen[f.key] ??= new Set());
          if (set.has(v.toLowerCase())) { status = "error"; notes.push(`Duplicate ${f.label} in file`); }
          else set.add(v.toLowerCase());
        }
      }
      return { index: i, values, status, notes };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRows, mapping]);

  const counts = useMemo(() => ({
    ok: validated.filter((r) => r.status === "ok").length,
    warn: validated.filter((r) => r.status === "warn").length,
    error: validated.filter((r) => r.status === "error").length,
  }), [validated]);

  const importable = validated.filter((r) => r.status !== "error");

  async function commit() {
    setCommitting(true);
    setCommitError(null);
    try {
      const res = await importAction(importable.map((r) => r.values));
      setResult(res);
      setStep(4);
    } catch (e) {
      // Without this the button simply stopped spinning and stayed on the
      // review step, which is indistinguishable from the import having
      // silently done nothing. Nothing was written, so say so.
      setCommitError(
        e instanceof Error && e.message
          ? `The import did not run: ${e.message}. Nothing was saved — you can try again.`
          : "The import did not run and nothing was saved. Check your connection and try again."
      );
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setStep(1); setFileName(null); setHeaders([]); setDataRows([]);
    setMapping({}); setParseError(null); setResult(null);
    setCommitError(null); setTruncatedFrom(null); setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const card = "bg-card border border-border rounded-lg shadow-sm";
  const requiredUnmapped = requiredKeys.some((k) => (mapping[k] ?? -1) < 0);

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 1 && (
        <div className={`${card} p-8`}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center text-center gap-3 transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="w-14 h-14 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <UploadCloud size={26} />
            </div>
            <h3 className="font-semibold text-foreground">Drop your spreadsheet here</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Excel (.xlsx, .xls) or CSV. The first row must be column headers. Everything is parsed in your browser — nothing uploads until you commit.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => inputRef.current?.click()} className="px-4 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet size={16} /> Choose file
              </button>
              <button onClick={downloadTemplate} className="px-4 py-2 rounded-md border border-border text-foreground text-sm font-medium flex items-center gap-2 hover:bg-muted">
                <Download size={16} /> Download template
              </button>
            </div>
            <input ref={inputRef} type="file" aria-label={`Choose a spreadsheet of ${entityLabel}`}
              accept={IMPORT_EXTENSIONS.join(",")} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          {parseError && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><XCircle size={16} aria-hidden /> {parseError}</p>}
          <p className="mt-4 text-xs text-muted-foreground">
            Tip: download the template for the exact columns. Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-foreground">Map your columns</h3>
              <p className="text-sm text-muted-foreground">
                <FileSpreadsheet size={13} className="inline mb-0.5" aria-hidden /> {fileName} &middot; {dataRows.length} rows &middot; {headers.length} columns.
                {truncatedFrom !== null && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1">
                    That file had {truncatedFrom} rows. Only the first {dataRows.length} are loaded — import these, then upload the rest.
                  </span>
                )}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground flex items-center gap-1">
              <Sparkles size={12} /> {fields.filter((f) => (mapping[f.key] ?? -1) >= 0).length}/{fields.length} auto-matched
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-sm text-foreground">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                <select value={mapping[f.key] ?? -1} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                  className="w-1/2 border border-border rounded-md p-2 text-sm bg-card text-foreground outline-none focus:border-primary">
                  <option value={-1}>— not mapped —</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
            ))}
          </div>
          {requiredUnmapped && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={15} /> All required fields must be mapped to continue.
            </p>
          )}
          <div className="flex justify-between pt-2">
            <button onClick={reset} className="px-4 py-2 rounded-md border border-border text-sm flex items-center gap-2 hover:bg-muted"><ArrowLeft size={15} /> Start over</button>
            <button disabled={requiredUnmapped} onClick={() => setStep(3)}
              className="px-4 py-2 rounded-md bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground text-sm font-medium flex items-center gap-2">
              Review rows <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat icon={<CheckCircle2 size={18} />} label="Ready to import" value={counts.ok} tone="emerald" />
            <SummaryStat icon={<AlertTriangle size={18} />} label="Import with warnings" value={counts.warn} tone="amber" />
            <SummaryStat icon={<XCircle size={18} />} label="Will be skipped" value={counts.error} tone="red" />
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-[26rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-10">#</th>
                    {primaryKeys.map((k) => (
                      <th key={k} className="text-left font-medium px-3 py-2">{fields.find((f) => f.key === k)?.label ?? k}</th>
                    ))}
                    <th className="text-left font-medium px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.slice(0, IMPORT_LIMITS.previewRows).map((r) => (
                    <tr key={r.index} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{r.index + 1}</td>
                      {primaryKeys.map((k) => (
                        <td key={k} className="px-3 py-2 text-foreground">{r.values[k] || <span className="text-muted-foreground">—</span>}</td>
                      ))}
                      <td className="px-3 py-2"><StatusBadge status={r.status} notes={r.notes} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {validated.length > IMPORT_LIMITS.previewRows && (
            <p className="text-xs text-muted-foreground">
              Showing the first {IMPORT_LIMITS.previewRows} of {validated.length} rows. The counts above cover all of them,
              and every row without an error is imported.
            </p>
          )}
          {commitError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
              <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {commitError}
            </p>
          )}
          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-md border border-border text-sm flex items-center gap-2 hover:bg-muted"><ArrowLeft size={15} /> Back to mapping</button>
            <button disabled={importable.length === 0 || committing} onClick={commit}
              className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-2">
              {committing ? <><Loader2 size={15} className="animate-spin" /> Importing…</> : <>Import {importable.length} {entityLabel} <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 size={24} /></div>
            <div>
              <h3 className="font-semibold text-foreground">Import complete</h3>
              <p className="text-sm text-muted-foreground">{result.created} added &middot; {result.skipped} skipped &middot; {result.failed} failed</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat icon={<CheckCircle2 size={18} />} label="Added" value={result.created} tone="emerald" />
            <SummaryStat icon={<AlertTriangle size={18} />} label="Skipped" value={result.skipped} tone="amber" />
            <SummaryStat icon={<XCircle size={18} />} label="Failed" value={result.failed} tone="red" />
          </div>
          {result.messages.length > 0 && (
            <div className="border border-border rounded-lg max-h-72 overflow-auto divide-y divide-border">
              {result.messages.map((m, i) => (
                <div key={i} className="px-4 py-2 text-sm flex items-start gap-2">
                  {m.status === "created" ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    : m.status === "skipped" ? <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    : <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />}
                  <span className="text-foreground"><b className="text-muted-foreground font-normal">Row {m.row}:</b> {m.detail}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-1">
            <button onClick={reset} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">Import another file</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Upload", "Map columns", "Review", "Done"];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${active ? "bg-white/25" : done ? "bg-emerald-200 dark:bg-emerald-800" : "bg-border"}`}>{done ? "✓" : n}</span>
              {l}
            </div>
            {i < labels.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function SummaryStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "emerald" | "amber" | "red" }) {
  const tones = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900",
    amber: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-900",
    red: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900",
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2">{icon}<span className="text-2xl font-bold">{value}</span></div>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ status, notes }: { status: RowStatus; notes: string[] }) {
  if (status === "ok") return <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={13} /> Ready</span>;
  if (status === "warn") return <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"><AlertTriangle size={13} /> {notes.join(", ")}</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><XCircle size={13} /> {notes.join(", ")}</span>;
}
