"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

import EvidenceTagger, { type TagView } from "@/components/accreditation/EvidenceTagger";
import { uploadEvidenceDocument } from "./actions";

interface DocumentRow {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  fileUrl: string;
  academicYear: string | null;
  reviewedOn: string | null;
  tags: TagView[];
}

const KINDS = [
  { value: "POLICY", label: "Policy" },
  { value: "MINUTES", label: "Minutes" },
  { value: "HANDBOOK", label: "Handbook" },
  { value: "PLAN", label: "Plan" },
  { value: "REPORT", label: "Report" },
];

/**
 * The document half of the evidence base.
 *
 * Purpose and Environment are carried by governance documents, not by
 * classroom records, so without this the dashboard reports those categories as
 * permanent gaps however well the school is actually run.
 */
export default function DocumentRegisterClient({ documents }: { documents: DocumentRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result: { success: true; id: string } | { error: string } = await uploadEvidenceDocument(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5">
      <h2 className="font-bold text-slate-800 dark:text-slate-100">Document register</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        Policies, minutes and handbooks. Tag each one to the practices it evidences.
      </p>

      <form ref={formRef} action={submit} className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Title, e.g. Language Policy 2026-27"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 sm:col-span-2"
        />
        <select
          name="kind"
          required
          defaultValue="POLICY"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          name="academicYear"
          placeholder="Academic year, e.g. 2026-27"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
        />
        <label className="text-xs text-slate-500 flex flex-col gap-1">
          Last reviewed
          <input
            name="reviewedOn"
            type="date"
            className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-500 flex flex-col gap-1">
          File
          <input
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5"
          />
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="What is it, and what does it evidence? (optional)"
          className="text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 sm:col-span-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1 w-fit"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Add document
        </button>
      </form>

      {error && <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

      <ul className="mt-5 divide-y divide-slate-100 dark:divide-zinc-800">
        {documents.length === 0 && (
          <li className="py-3 text-sm text-slate-500">
            No documents yet. Purpose and Environment cannot be evidenced without them.
          </li>
        )}
        {documents.map((d) => (
          <li key={d.id} className="py-3">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  {d.title}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  {d.kind}
                  {d.academicYear ? ` · ${d.academicYear}` : ""}
                  {d.reviewedOn ? ` · reviewed ${d.reviewedOn}` : " · never reviewed"}
                </p>
                {d.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{d.description}</p>}
                <EvidenceTagger kind="DOCUMENT" recordId={d.id} tags={d.tags} canConfirm />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
