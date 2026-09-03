'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Sparkles, RefreshCw } from 'lucide-react';
import { SubmitButton, FormFeedback } from '@/components/ui/form';
import { uploadAndGrade, retryGrading } from './actions';
import SubmissionReport from './SubmissionReport';
import type { SubmissionRow } from './types';

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
  const [state, action] = useActionState(uploadAndGrade, undefined);
  const [programme, setProgramme] = useState<'DP' | 'MYP'>('DP');
  const [courseworkType, setCourseworkType] = useState('exam');
  const [fileName, setFileName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const activeClass = classes.find(c => c.id === activeClassId) ?? classes[0];

  const handleRetry = async (id: string) => {
    setRetrying(id);
    await retryGrading(id);
    setRetrying(null);
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

      {/* Upload card */}
      <form
        ref={formRef}
        action={formData => {
          action(formData);
          setFileName(null);
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
          <label className="block text-xs font-medium text-slate-500 mb-2">Scanned answer sheet</label>
          <div
            className="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileInput.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped && fileInput.current) {
                const dt = new DataTransfer();
                dt.items.add(dropped);
                fileInput.current.files = dt.files;
                setFileName(dropped.name);
              }
            }}
          >
            <UploadCloud size={36} className="text-slate-400 mb-3" aria-hidden />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {fileName ?? 'Drop a scanned answer sheet PDF here, or click to browse'}
            </p>
            <input
              ref={fileInput}
              type="file"
              name="file"
              accept="application/pdf"
              required
              className="hidden"
              onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <FormFeedback state={state} className="flex-1" />
          <SubmitButton pendingText="Uploading…" className="!bg-indigo-600 hover:!bg-indigo-700 !text-white shrink-0">
            <Sparkles size={16} aria-hidden /> Grade with AI
          </SubmitButton>
        </div>
      </form>

      {/* Queue */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{activeClass?.name} — graded sheets</h3>
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
  retrying
}: {
  submission: SubmissionRow;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const canOpen = submission.status !== 'OCR_PROCESSING' && submission.status !== 'EVALUATING';
  const pct = submission.maxTotal > 0 ? Math.round((submission.totalScore / submission.maxTotal) * 100) : null;

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
        </td>
        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">
          {pct !== null ? `${submission.totalScore}/${submission.maxTotal} (${pct}%)` : '—'}
        </td>
        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
          {submission.status === 'FAILED' && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 disabled:opacity-60"
            >
              <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} aria-hidden /> Retry
            </button>
          )}
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
