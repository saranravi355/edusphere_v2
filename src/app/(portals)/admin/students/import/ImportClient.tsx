"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { importStudents, type ImportResult, type ImportStudentRow } from "./actions";

type FieldDef = { key: keyof ImportStudentRow; label: string; required?: boolean; aliases: string[] };

const FIELDS: FieldDef[] = [
  { key: "name", label: "Full Name", required: true, aliases: ["name", "fullname", "studentname", "student"] },
  { key: "registrationNo", label: "Registration No", aliases: ["registrationno", "regno", "admissionno", "rollno", "id"] },
  { key: "email", label: "Student Email", aliases: ["email", "studentemail", "loginemail", "emailid"] },
  { key: "curriculum", label: "IB Programme", required: true, aliases: ["curriculum", "programme", "program", "ibprogramme", "ib"] },
  { key: "classroom", label: "Class / Section", aliases: ["classroom", "class", "section", "homeroom", "grade"] },
  { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
  { key: "dateOfBirth", label: "Date of Birth", aliases: ["dateofbirth", "dob", "birthdate"] },
  { key: "bloodGroup", label: "Blood Group", aliases: ["bloodgroup", "blood"] },
  { key: "address", label: "Address", aliases: ["address"] },
  { key: "nationality", label: "Nationality", aliases: ["nationality"] },
  { key: "motherTongue", label: "Mother Tongue", aliases: ["mothertongue", "firstlanguage"] },
  { key: "fatherName", label: "Father's Name", aliases: ["fathername", "father"] },
  { key: "motherName", label: "Mother's Name", aliases: ["mothername", "mother"] },
  { key: "motherOccupation", label: "Mother's Occupation", aliases: ["motheroccupation"] },
  { key: "parentName", label: "Parent Name", aliases: ["parentname", "guardian", "guardianname"] },
  { key: "parentEmail", label: "Parent Email", aliases: ["parentemail", "guardianemail"] },
  { key: "parentPhone", label: "Parent Phone", aliases: ["parentphone", "phone", "mobile", "contact", "contactno"] },
];

const VALID_CURRICULA = ["PYP", "MYP", "DP"];

const TEMPLATE_HEADERS = FIELDS.map((f) => f.label);
const TEMPLATE_EXAMPLE = [
  "Aarav Sharma", "STU-2026-501", "aarav.sharma@student.edusphere.com", "MYP", "MYP1A", "Male",
  "14/03/2013", "B+", "42 Jayanagar 4th Block, Bengaluru 560011", "Indian", "Kannada",
  "Rohan Sharma", "Priya Sharma", "Architect", "Priya Sharma", "parent.aarav@edusphere.com", "+91 98450 12345",
];

type RowStatus = "ok" | "warn" | "error";
type ValidatedRow = { index: number; values: ImportStudentRow; status: RowStatus; notes: string[] };

function normalize(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ImportClient({ classrooms }: { classrooms: string[] }) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const classSet = useMemo(() => new Set(classrooms.map((c) => c.trim().toLowerCase())), [classrooms]);

  function autoMap(hdrs: string[]) {
    const map: Record<string, number> = {};
    for (const f of FIELDS) {
      const idx = hdrs.findIndex((h) => f.aliases.includes(normalize(h)));
      map[f.key] = idx;
    }
    setMapping(map);
  }

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, raw: false, defval: "" });
        if (!rows.length) {
          setParseError("The file appears to be empty.");
          return;
        }
        const hdrs = rows[0].map((h) => String(h ?? "").trim());
        const body = rows.slice(1).filter((r) => r.some((c) => String(c ?? "").trim().length));
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
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "edusphere-student-import-template.xlsx");
  }

  function mapRow(row: string[]): ImportStudentRow {
    const obj: ImportStudentRow = {};
    for (const f of FIELDS) {
      const idx = mapping[f.key];
      if (idx !== undefined && idx >= 0) {
        const v = row[idx]?.trim();
        if (v) (obj[f.key] as string) = v;
      }
    }
    return obj;
  }

  const validated: ValidatedRow[] = useMemo(() => {
    const seenReg = new Set<string>();
    const seenEmail = new Set<string>();
    return dataRows.map((row, i) => {
      const values = mapRow(row);
      const notes: string[] = [];
      let status: RowStatus = "ok";

      if (!values.name) { status = "error"; notes.push("Missing name"); }

      const curr = values.curriculum?.toUpperCase();
      if (!curr) { status = "error"; notes.push("Missing IB programme"); }
      else if (!VALID_CURRICULA.includes(curr)) { status = "error"; notes.push(`Programme must be PYP/MYP/DP`); }

      if (values.classroom && !classSet.has(values.classroom.toLowerCase())) {
        status = "error"; notes.push(`Unknown class "${values.classroom}"`);
      }

      if (values.email) {
        const e = values.email.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { status = "error"; notes.push("Invalid email"); }
        else if (seenEmail.has(e)) { status = "error"; notes.push("Duplicate email in file"); }
        else seenEmail.add(e);
      }

      if (values.registrationNo) {
        const r = values.registrationNo.toLowerCase();
        if (seenReg.has(r)) { status = "error"; notes.push("Duplicate reg. no in file"); }
        else seenReg.add(r);
      }

      if (values.parentPhone && !/^\+?91/.test(values.parentPhone.replace(/\s/g, ""))) {
        if (status === "ok") status = "warn";
        notes.push("Phone not in +91 format");
      }

      if (values.dateOfBirth) {
        const d = new Date(values.dateOfBirth);
        const dm = values.dateOfBirth.match(/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/);
        if (isNaN(d.getTime()) && !dm) {
          if (status === "ok") status = "warn";
          notes.push("Unparseable date of birth");
        }
      }

      return { index: i, values, status, notes };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRows, mapping, classSet]);

  const counts = useMemo(() => ({
    ok: validated.filter((r) => r.status === "ok").length,
    warn: validated.filter((r) => r.status === "warn").length,
    error: validated.filter((r) => r.status === "error").length,
  }), [validated]);

  const importable = validated.filter((r) => r.status !== "error");

  async function commit() {
    setCommitting(true);
    try {
      const payload: ImportStudentRow[] = importable.map((r) => r.values);
      const res = await importStudents(payload);
      setResult(res);
      setStep(4);
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setStep(1); setFileName(null); setHeaders([]); setDataRows([]);
    setMapping({}); setParseError(null); setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const card = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm";

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {/* STEP 1 — UPLOAD */}
      {step === 1 && (
        <div className={`${card} p-8`}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-10 flex flex-col items-center text-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UploadCloud size={26} />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Drop your spreadsheet here</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Excel (.xlsx, .xls) or CSV. The first row must be column headers. Everything is parsed in your browser — nothing uploads until you commit.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2"
              >
                <FileSpreadsheet size={16} /> Choose file
              </button>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <Download size={16} /> Download template
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
          {parseError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle size={16} /> {parseError}
            </p>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Tip: download the template for the exact columns. Only <b>Full Name</b> and <b>IB Programme</b> are required; leave the rest blank and the system fills sensible defaults (auto reg. no, generated parent login).
          </p>
        </div>
      )}

      {/* STEP 2 — MAP COLUMNS */}
      {step === 2 && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Map your columns</h3>
              <p className="text-sm text-slate-500">
                <FileSpreadsheet size={13} className="inline mb-0.5" /> {fileName} &middot; {dataRows.length} rows &middot; {headers.length} columns.
                Matched columns are auto-selected — adjust any that look wrong.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles size={12} /> {FIELDS.filter((f) => mapping[f.key] >= 0).length}/{FIELDS.length} auto-matched
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mapping[f.key] ?? -1}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                  className="w-1/2 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-sm dark:bg-zinc-800 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value={-1}>— not mapped —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {(mapping.name < 0 || mapping.curriculum < 0) && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={15} /> Full Name and IB Programme must be mapped to continue.
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
              <ArrowLeft size={15} /> Start over
            </button>
            <button
              disabled={mapping.name < 0 || mapping.curriculum < 0}
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2"
            >
              Review rows <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — VALIDATE & PREVIEW */}
      {step === 3 && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat icon={<CheckCircle2 size={18} />} label="Ready to import" value={counts.ok} tone="emerald" />
            <SummaryStat icon={<AlertTriangle size={18} />} label="Import with warnings" value={counts.warn} tone="amber" />
            <SummaryStat icon={<XCircle size={18} />} label="Will be skipped" value={counts.error} tone="red" />
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="max-h-[26rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 sticky top-0">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-10">#</th>
                    <th className="text-left font-medium px-3 py-2">Name</th>
                    <th className="text-left font-medium px-3 py-2">Programme</th>
                    <th className="text-left font-medium px-3 py-2">Class</th>
                    <th className="text-left font-medium px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.map((r) => (
                    <tr key={r.index} className="border-t border-slate-100 dark:border-zinc-800">
                      <td className="px-3 py-2 text-slate-400">{r.index + 1}</td>
                      <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{r.values.name || <span className="text-slate-400">—</span>}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.values.curriculum || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.values.classroom || "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} notes={r.notes} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
              <ArrowLeft size={15} /> Back to mapping
            </button>
            <button
              disabled={importable.length === 0 || committing}
              onClick={commit}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2"
            >
              {committing ? <><Loader2 size={15} className="animate-spin" /> Importing…</> : <>Import {importable.length} students <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — RESULT */}
      {step === 4 && result && (
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Import complete</h3>
              <p className="text-sm text-slate-500">
                {result.created} enrolled &middot; {result.skipped} skipped &middot; {result.failed} failed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <SummaryStat icon={<CheckCircle2 size={18} />} label="Enrolled" value={result.created} tone="emerald" />
            <SummaryStat icon={<AlertTriangle size={18} />} label="Skipped" value={result.skipped} tone="amber" />
            <SummaryStat icon={<XCircle size={18} />} label="Failed" value={result.failed} tone="red" />
          </div>

          {result.messages.length > 0 && (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl max-h-72 overflow-auto divide-y divide-slate-100 dark:divide-zinc-800">
              {result.messages.map((m, i) => (
                <div key={i} className="px-4 py-2 text-sm flex items-start gap-2">
                  {m.status === "created" ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    : m.status === "skipped" ? <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    : <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />}
                  <span className="text-slate-600 dark:text-slate-300"><b className="text-slate-400 font-normal">Row {m.row}:</b> {m.detail}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-1">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
              Import another file
            </button>
            <a href="/admin/students/registry" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
              View Student Registry <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Upload", "Map columns", "Review", "Done"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              active ? "bg-blue-600 text-white" : done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${active ? "bg-white/25" : done ? "bg-emerald-200 dark:bg-emerald-800" : "bg-slate-200 dark:bg-zinc-700"}`}>
                {done ? "✓" : n}
              </span>
              {l}
            </div>
            {i < labels.length - 1 && <div className="w-6 h-px bg-slate-200 dark:bg-zinc-700" />}
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
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
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
