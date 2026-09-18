'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadCloud, Files, Sparkles, RefreshCw, Trash2, BarChart3, Download } from 'lucide-react';
import { SubmitButton, FormFeedback } from '@/components/ui/form';
import { uploadAndGrade, retryGrading, deleteSubmission } from './actions';
import { bulkUploadAndGrade } from './bulkActions';
import SubmissionReport from './SubmissionReport';
import type { SubmissionRow } from './types';

const IN_FLIGHT_STATUSES = ['OCR_PROCESSING', 'EVALUATING'];

const COURSEWORK_TYPES: { value: string; label: string }[] = [
  { value: 'internal-assessment', label: 'Internal Assessment' },
  { value: 'extended-essay', label: 'Extended Essay' },
  { value: 'tok', label: 'TOK essay/exhibition' },
  { value: 'external-assessment', label: 'External Assessment' },
  { value: 'exam', label: 'Exam' }
];

const TERMS = ['Term 1 2026-27', 'Term 2 2026-27', 'Term 3 2026-27'];

const STATUS_STYLE: Record<string, string> = {
  OCR_PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EVALUATING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  EVALUATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  NEEDS_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

const STATUS_LABEL: Record<string, string> = {
  OCR_PROCESSING: 'Reading scan…',
  EVALUATING: 'Grading…',
  EVALUATED: 'Evaluated',
  NEEDS_REVIEW: 'Needs review',
  PUBLISHED: 'Published',
  FAILED: 'Failed'
};

const select =
  'p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black font-medium ' +
  'text-slate-700 dark:text-slate-300 text-sm';

export default function AIGraderClient({
  classes,
  activeClassId,
  mySubjects,
  students,
  submissions
}: {
  classes: { id: string; name: string }[];
  activeClassId: string;
  mySubjects: string[];
  students: { id: string; name: string; registrationNo: string }[];
  submissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [state, action] = useActionState(uploadAndGrade, undefined);
  const [bulkState, bulkAction] = useActionState(bulkUploadAndGrade, undefined);
  const [programme, setProgramme] = useState<'DP' | 'MYP'>('DP');
  const [courseworkType, setCourseworkType] = useState('exam');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [markingSchemeFileName, setMarkingSchemeFileName] = useState<string | null>(null);
  const [bulkFileNames, setBulkFileNames] = useState<string[]>([]);
  const [bulkMarkingSchemeFileName, setBulkMarkingSchemeFileName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bulkFileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bulkFormRef = useRef<HTMLFormElement>(null);

  const activeClass = classes.find(c => c.id === activeClassId) ?? classes[0];

  // Bulk-uploaded sheets are graded in the background (see bulkUploadAndGrade's use of
  // next/server's after()), so nothing pushes an update to this page when one finishes -
  // poll while anything is still mid-grading, for both single and bulk uploads.
  const hasInFlight = submissions.some(s => IN_FLIGHT_STATUSES.includes(s.status));
  useEffect(() => {
    if (!hasInFlight) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [hasInFlight, router]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    await retryGrading(id);
    setRetrying(null);
    router.refresh();
  };

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeleting(id);
    await deleteSubmission(id);
    setDeleting(null);
    if (expanded === id) setExpanded(null);
    router.refresh();
  };

  const isHolistic = courseworkType === 'extended-essay' || courseworkType === 'tok';

  return (
    <div className="space-y-6">
      {/* Class switcher — same GET-form pattern as the manual gradebook, so the active class is a shareable URL */}
      {classes.length > 1 && (
        <form className="flex items-end gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-class">Class</label>
            <select
              id="ag-class"
              name="classId"
              defaultValue={activeClassId}
              className={select}
              onChange={e => router.push(`/teacher/grading/ai-grader?classId=${e.target.value}`)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      )}

      {/* Single vs bulk upload toggle */}
      <div className="flex gap-2">
        {(['single', 'bulk'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1.5 ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {m === 'single' ? <UploadCloud size={14} aria-hidden /> : <Files size={14} aria-hidden />}
            {m === 'single' ? 'Single upload' : 'Bulk upload'}
          </button>
        ))}
      </div>

      {/* Upload card — single sheet, one student picked up front */}
      {mode === 'single' && (
      <form
        ref={formRef}
        action={formData => {
          action(formData);
          setFileNames([]);
          setMarkingSchemeFileName(null);
          formRef.current?.reset();
        }}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5"
      >
        <input type="hidden" name="classroomId" value={activeClassId} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-student">Student</label>
            <select id="ag-student" name="studentId" required className={`${select} w-full`}>
              <option value="">Choose a student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.registrationNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-subject">Subject</label>
            <select id="ag-subject" name="subjectName" required className={`${select} w-full`}>
              {mySubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-programme">Programme</label>
            <select
              id="ag-programme"
              name="programme"
              value={programme}
              onChange={e => setProgramme(e.target.value as 'DP' | 'MYP')}
              className={`${select} w-full`}
            >
              <option value="DP">Diploma Programme (DP)</option>
              <option value="MYP">Middle Years Programme (MYP)</option>
            </select>
          </div>
          {programme === 'DP' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-level">Level</label>
              <select id="ag-level" name="level" defaultValue="HL" className={`${select} w-full`}>
                <option value="SL">SL</option>
                <option value="HL">HL</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Coursework type</label>
          <div className="flex flex-wrap gap-2">
            {COURSEWORK_TYPES.map(t => (
              <label key={t.value}>
                <input
                  type="radio"
                  name="courseworkType"
                  value={t.value}
                  checked={courseworkType === t.value}
                  onChange={() => setCourseworkType(t.value)}
                  className="sr-only peer"
                />
                <span className="inline-block px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          {isHolistic && (
            <p className="text-xs text-slate-400 mt-1.5">Graded as one continuous piece of writing, not separate questions.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-title">Assessment name</label>
            <input
              id="ag-title"
              name="title"
              required
              placeholder="e.g. Unit Test 2: Mechanics"
              className={`${select} w-full`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-term">Term</label>
            <select id="ag-term" name="term" defaultValue={TERMS[0]} className={`${select} w-full`}>
              {TERMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Answer sheet</label>
          <div
            className="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileInput.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files ?? []);
              if (dropped.length && fileInput.current) {
                const dt = new DataTransfer();
                dropped.forEach(f => dt.items.add(f));
                fileInput.current.files = dt.files;
                setFileNames(dropped.map(f => f.name));
              }
            }}
          >
            <UploadCloud size={36} className="text-slate-400 mb-3" aria-hidden />
            {fileNames.length > 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} pages selected`}
              </p>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-sm">Drop a scanned PDF, Word doc, text file, or photo here, or click to browse</p>
            )}
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              PDF, DOCX, TXT, JPG, PNG or WEBP — select multiple photos for a multi-page sheet
            </p>
            <input
              ref={fileInput}
              type="file"
              name="files"
              multiple
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
              required
              className="hidden"
              onChange={e => setFileNames(Array.from(e.target.files ?? []).map(f => f.name))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="ag-marking-scheme">
            Marking scheme <span className="text-slate-400 font-normal">(optional, but recommended)</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Upload the exam questions, model/expected answers and marks per question — grading is graded against this instead of the AI inferring its own rubric. Saved for this assessment, so it&apos;s reused automatically on later uploads for the same subject/title/term.
          </p>
          <input
            id="ag-marking-scheme"
            type="file"
            name="markingScheme"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
            onChange={e => setMarkingSchemeFileName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-zinc-800 file:text-slate-700 dark:file:text-slate-200"
          />
          {markingSchemeFileName && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{markingSchemeFileName} selected</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <FormFeedback state={state} className="flex-1" />
          <SubmitButton pendingText="Uploading…" className="!bg-indigo-600 hover:!bg-indigo-700 !text-white shrink-0">
            <Sparkles size={16} aria-hidden /> Grade with AI
          </SubmitButton>
        </div>
      </form>
      )}

      {/* Bulk upload card — one assessment, many sheets, no student picked up front. Every
          sheet is matched to a student by filename alone; the whole batch is rejected if any
          file doesn't match exactly one roster student. */}
      {mode === 'bulk' && (
      <form
        ref={bulkFormRef}
        action={formData => {
          bulkAction(formData);
          setBulkFileNames([]);
          setBulkMarkingSchemeFileName(null);
          bulkFormRef.current?.reset();
        }}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5"
      >
        <input type="hidden" name="classroomId" value={activeClassId} />
        <p className="text-xs text-slate-500 -mt-1">
          One assessment, many students&apos; sheets at once. <strong>Every file must be named with that student&apos;s registration number or full name</strong> (e.g. &quot;STU-2026-001.pdf&quot; or &quot;Aarav_Patel.pdf&quot;) — sheets are matched to students by filename only, and the whole batch is rejected if any file doesn&apos;t match.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-subject">Subject</label>
            <select id="bag-subject" name="subjectName" required className={`${select} w-full`}>
              {mySubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-programme">Programme</label>
            <select
              id="bag-programme"
              name="programme"
              value={programme}
              onChange={e => setProgramme(e.target.value as 'DP' | 'MYP')}
              className={`${select} w-full`}
            >
              <option value="DP">Diploma Programme (DP)</option>
              <option value="MYP">Middle Years Programme (MYP)</option>
            </select>
          </div>
          {programme === 'DP' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-level">Level</label>
              <select id="bag-level" name="level" defaultValue="HL" className={`${select} w-full`}>
                <option value="SL">SL</option>
                <option value="HL">HL</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Coursework type</label>
          <div className="flex flex-wrap gap-2">
            {COURSEWORK_TYPES.map(t => (
              <label key={t.value}>
                <input
                  type="radio"
                  name="courseworkType"
                  value={t.value}
                  checked={courseworkType === t.value}
                  onChange={() => setCourseworkType(t.value)}
                  className="sr-only peer"
                />
                <span className="inline-block px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-title">Assessment name</label>
            <input
              id="bag-title"
              name="title"
              required
              placeholder="e.g. Unit Test 2: Mechanics"
              className={`${select} w-full`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-term">Term</label>
            <select id="bag-term" name="term" defaultValue={TERMS[0]} className={`${select} w-full`}>
              {TERMS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Answer sheets (multiple)</label>
          <div
            className="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => bulkFileInput.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files ?? []);
              if (dropped.length && bulkFileInput.current) {
                const dt = new DataTransfer();
                dropped.forEach(f => dt.items.add(f));
                bulkFileInput.current.files = dt.files;
                setBulkFileNames(dropped.map(f => f.name));
              }
            }}
          >
            <Files size={36} className="text-slate-400 mb-3" aria-hidden />
            {bulkFileNames.length > 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm">{bulkFileNames.length} file{bulkFileNames.length === 1 ? '' : 's'} selected</p>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-sm">Drop the whole class&apos;s sheets here, or click to browse</p>
            )}
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">PDF, DOCX, TXT, JPG, PNG or WEBP</p>
            <input
              ref={bulkFileInput}
              type="file"
              name="files"
              multiple
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
              required
              className="hidden"
              onChange={e => setBulkFileNames(Array.from(e.target.files ?? []).map(f => f.name))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="bag-marking-scheme">
            Marking scheme <span className="text-slate-400 font-normal">(optional, but recommended)</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Upload the exam questions, model/expected answers and marks per question once for the whole batch — every sheet in this batch is graded against it instead of the AI inferring its own rubric.
          </p>
          <input
            id="bag-marking-scheme"
            type="file"
            name="markingScheme"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
            onChange={e => setBulkMarkingSchemeFileName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-zinc-800 file:text-slate-700 dark:file:text-slate-200"
          />
          {bulkMarkingSchemeFileName && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{bulkMarkingSchemeFileName} selected</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <FormFeedback state={bulkState} className="flex-1" />
          <SubmitButton pendingText="Uploading…" className="!bg-indigo-600 hover:!bg-indigo-700 !text-white shrink-0">
            <Sparkles size={16} aria-hidden /> Grade batch with AI
          </SubmitButton>
        </div>
      </form>
      )}

      {/* Queue */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{activeClass?.name} — graded sheets</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Download class results:</span>
            <a
              href={`/teacher/grading/ai-grader/export/class?classId=${activeClassId}&format=pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
            >
              <Download size={13} aria-hidden /> PDF
            </a>
            <a
              href={`/teacher/grading/ai-grader/export/class?classId=${activeClassId}&format=docx`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
            >
              <Download size={13} aria-hidden /> DOCX
            </a>
            <Link
              href={`/teacher/grading/ai-grader/analytics?classId=${activeClassId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <BarChart3 size={13} aria-hidden /> Class Analytics
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs uppercase text-slate-500 bg-slate-50 dark:bg-zinc-900/30">
                <th className="p-4 font-medium min-w-[180px]">Student</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium min-w-[160px]">Assessment</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {submissions.map(s => (
                <SubmissionQueueRow
                  key={s.id}
                  submission={s}
                  expanded={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  onRetry={() => handleRetry(s.id)}
                  retrying={retrying === s.id}
                  onDelete={() => handleDelete(s.id, `${s.studentName} — ${s.title}`)}
                  deleting={deleting === s.id}
                />
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-slate-500">
                    No answer sheets graded for {activeClass?.name} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SubmissionQueueRow({
  submission,
  expanded,
  onToggle,
  onRetry,
  retrying,
  onDelete,
  deleting
}: {
  submission: SubmissionRow;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
  retrying: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const canOpen = submission.status !== 'OCR_PROCESSING' && submission.status !== 'EVALUATING';
  const inFlight = submission.status === 'OCR_PROCESSING' || submission.status === 'EVALUATING';
  const hasResult = ['EVALUATED', 'NEEDS_REVIEW', 'PUBLISHED'].includes(submission.status);
  const pct = submission.maxTotal > 0 ? Math.round((submission.totalScore / submission.maxTotal) * 100) : null;

  // A bulk batch's background grading runs sequentially in one function invocation
  // (bulkUploadAndGrade's after()) - if that invocation gets cut off partway through (its own
  // max duration, a redeploy, a crash), a row can be left "in flight" forever with no error
  // ever recorded. 6 minutes is just above PaddleOCR's own 5-minute worst-case poll timeout, so
  // a genuinely still-working single job isn't mistaken for a stuck one. `now` only ever
  // changes from the interval callback (never set synchronously in the effect body itself, per
  // React's rules on effects), and the actual "stuck" check is a plain, pure render-time
  // comparison against it - no impure Date.now() call in the render body.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!inFlight) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [inFlight]);
  const STUCK_THRESHOLD_MS = 6 * 60 * 1000;
  const stuck = inFlight && now - new Date(submission.createdAt).getTime() > STUCK_THRESHOLD_MS;

  return (
    <>
      <tr
        className={`transition-colors ${canOpen ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/20' : ''}`}
        onClick={() => canOpen && onToggle()}
      >
        <td className="p-4">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{submission.studentName}</p>
          <p className="text-xs text-slate-500">{submission.registrationNo}</p>
        </td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{submission.subjectName}</td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{submission.title}</td>
        <td className="p-4">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_STYLE[submission.status] ?? ''}`}>
            {STATUS_LABEL[submission.status] ?? submission.status}
          </span>
          {submission.status === 'FAILED' && submission.errorMessage && (
            <p className="text-[11px] text-red-500 mt-1 max-w-[220px]">{submission.errorMessage}</p>
          )}
          {stuck && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 max-w-[220px]">Stuck — try Retry.</p>
          )}
        </td>
        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">
          {pct !== null ? `${submission.totalScore}/${submission.maxTotal} (${pct}%)` : '—'}
        </td>
        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="inline-flex items-center gap-2">
            {hasResult && (
              <>
                <a
                  href={`/teacher/grading/ai-grader/export/sheet?submissionId=${submission.id}&format=pdf`}
                  title="Download this sheet as PDF"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200"
                >
                  <Download size={12} aria-hidden /> PDF
                </a>
                <a
                  href={`/teacher/grading/ai-grader/export/sheet?submissionId=${submission.id}&format=docx`}
                  title="Download this sheet as DOCX"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200"
                >
                  <Download size={12} aria-hidden /> DOCX
                </a>
              </>
            )}
            {(submission.status === 'FAILED' || stuck) && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying || deleting}
                title={stuck ? 'This sheet stopped mid-grading — re-run it from scratch' : 'Retry'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} aria-hidden /> Retry
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={(inFlight && !stuck) || retrying || deleting}
              title={inFlight && !stuck ? 'Wait for grading to finish before deleting' : 'Delete'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 size={12} aria-hidden /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0 bg-slate-50/50 dark:bg-zinc-900/30">
            <SubmissionReport submission={submission} />
          </td>
        </tr>
      )}
    </>
  );
}
