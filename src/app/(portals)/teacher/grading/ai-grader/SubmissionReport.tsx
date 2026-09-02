'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Edit3, FileText } from 'lucide-react';
import { SubmitButton, FormFeedback } from '@/components/ui/form';
import { setTeacherOverrideScore, setTeacherOverrideQuestionScore, setTeacherFeedback, publishResult } from './actions';
import { getEffectiveTotalScore, getEffectiveQuestionScore, isScoreOverridden, isQuestionOverridden } from '@/lib/grading/effectiveScore';
import { computePageMarks, resolveMark } from '@/lib/grading/annotationLayout';
import type { ImageDims } from '@/lib/grading/annotationLayout';
import type { SubmissionRow } from './types';

type Tab = 'overview' | 'questions' | 'annotated' | 'pdf' | 'ocr';

const TAG_STYLE: Record<string, string> = {
  strength: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  weakness: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  suggestion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  criterion: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
};

const MARK_BORDER: Record<string, string> = {
  strength: 'border-emerald-500',
  weakness: 'border-red-500',
  suggestion: 'border-amber-500',
  criterion: 'border-indigo-500'
};

const MARK_FILL: Record<string, string> = {
  strength: 'bg-emerald-500/25',
  weakness: 'bg-red-500/25',
  suggestion: 'bg-amber-500/25',
  criterion: 'bg-indigo-500/25'
};

export default function SubmissionReport({ submission }: { submission: SubmissionRow }) {
  const [tab, setTab] = useState<Tab>('overview');

  const canPublish = submission.status === 'EVALUATED' || submission.status === 'NEEDS_REVIEW';
  const gradeScaleLabel = submission.programme === 'MYP' ? 'MYP subject grade' : 'IB course grade';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'questions', label: 'Questions' },
    ...(submission.ocrPages && submission.ocrPages.length > 0 ? [{ id: 'annotated' as Tab, label: 'Annotated paper' }] : []),
    { id: 'pdf', label: 'Original PDF' },
    ...(submission.ocrText ? [{ id: 'ocr' as Tab, label: 'OCR text' }] : [])
  ];

  return (
    <div className="p-6 border-t border-slate-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <FileText size={13} aria-hidden /> Original file
        </a>
      </div>

      {tab === 'overview' && <OverviewTab submission={submission} canPublish={canPublish} gradeScaleLabel={gradeScaleLabel} />}
      {tab === 'questions' && <QuestionsTab submission={submission} />}
      {tab === 'annotated' && <AnnotatedTab submission={submission} />}
      {tab === 'pdf' && (
        <iframe src={submission.fileUrl} title={`${submission.studentName} — original scan`} className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-zinc-800" />
      )}
      {tab === 'ocr' && (
        <pre className="text-xs bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
          {submission.ocrText}
        </pre>
      )}
    </div>
  );
}

function OverviewTab({
  submission,
  canPublish,
  gradeScaleLabel
}: {
  submission: SubmissionRow;
  canPublish: boolean;
  gradeScaleLabel: string;
}) {
  const router = useRouter();
  const r = submission.result;
  const effectiveScore = getEffectiveTotalScore(submission);
  const overridden = isScoreOverridden(submission);
  const pct = r.maxTotal > 0 ? Math.round((effectiveScore / r.maxTotal) * 100) : 0;

  const [overriding, setOverriding] = useState(false);
  const [overrideValue, setOverrideValue] = useState(String(effectiveScore));
  const [savingOverride, setSavingOverride] = useState(false);

  const [feedbackState, feedbackAction] = useActionState(setTeacherFeedback, undefined);
  const [publishState, publishAction] = useActionState(publishResult, undefined);

  const saveOverride = async () => {
    setSavingOverride(true);
    const n = Number(overrideValue);
    await setTeacherOverrideScore(submission.id, Number.isFinite(n) ? n : null);
    setSavingOverride(false);
    setOverriding(false);
    router.refresh();
  };

  const clearOverride = async () => {
    setSavingOverride(true);
    await setTeacherOverrideScore(submission.id, null);
    setSavingOverride(false);
    router.refresh();
  };

  const suggestedComment = r.generalFeedback.slice(0, 2).join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-start gap-6">
          <div className="shrink-0 w-24 h-24 rounded-full border-8 border-emerald-500/20 flex items-center justify-center relative">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{effectiveScore}</span>
            <span className="absolute bottom-3 text-[10px] text-slate-400">/ {r.maxTotal}</span>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Detected subject: <strong>{r.detectedSubject}</strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{gradeScaleLabel} percentage: <strong>{pct}%</strong></p>
            {typeof submission.ocrConfidence === 'number' && (
              <p className="text-xs text-slate-400">OCR confidence: {Math.round(submission.ocrConfidence * 100)}%</p>
            )}
            {r.error && <p className="text-xs text-amber-600 dark:text-amber-400">{r.error}</p>}
          </div>
        </div>

        {r.generalFeedback.length > 0 && (
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
            {r.generalFeedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">AI-suggested score</p>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-300">{r.totalScore}/{r.maxTotal}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Teacher-approved score</p>
            {overriding ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={overrideValue}
                  onChange={e => setOverrideValue(e.target.value)}
                  className="w-16 p-1.5 border border-indigo-400 rounded text-center text-sm font-bold bg-white dark:bg-black"
                />
                <span className="text-xs text-slate-400">/ {r.maxTotal}</span>
                <SubmitButtonLike onClick={saveOverride} busy={savingOverride}>Save</SubmitButtonLike>
                <button type="button" onClick={() => setOverriding(false)} className="text-xs text-slate-500 px-2">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-mono text-sm font-bold ${overridden ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {effectiveScore}/{r.maxTotal}
                </span>
                {overridden && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">teacher-adjusted</span>}
                <button type="button" onClick={() => setOverriding(true)} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1">
                  <Edit3 size={12} aria-hidden /> Override
                </button>
                {overridden && (
                  <button type="button" onClick={clearOverride} disabled={savingOverride} className="text-xs text-red-500 hover:text-red-600">
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <form action={feedbackAction} className="space-y-2">
          <input type="hidden" name="submissionId" value={submission.id} />
          <label className="block text-xs font-medium text-slate-500" htmlFor="tf">Teacher feedback</label>
          <textarea
            id="tf"
            name="teacherFeedback"
            defaultValue={submission.teacherFeedback ?? ''}
            rows={3}
            placeholder="Add your own notes for this student…"
            className="w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-black text-slate-700 dark:text-slate-300"
          />
          <div className="flex items-center gap-3">
            <SubmitButton size="sm" pendingText="Saving…">Save feedback</SubmitButton>
            <FormFeedback state={feedbackState} />
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-fit">
        {submission.status === 'PUBLISHED' ? (
          <div className="text-center py-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Published</span>
            <p className="text-xs text-slate-400 mt-3">This result is live in the family-facing gradebook.</p>
          </div>
        ) : canPublish ? (
          <form action={publishAction} className="space-y-3">
            <input type="hidden" name="submissionId" value={submission.id} />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Publish to family gradebook</h4>
            <p className="text-xs text-slate-400">
              Confirm the final IB grade (1–7) based on the AI score above — this app never auto-computes a grade
              without real boundaries, so it&apos;s yours to enter, same as the manual gradebook.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pg-grade">Final IB grade</label>
              <input
                id="pg-grade"
                name="grade"
                type="number"
                min={1}
                max={7}
                step={1}
                required
                className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-center text-sm font-bold bg-white dark:bg-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pg-type">Type</label>
              <select id="pg-type" name="type" defaultValue="SUMMATIVE" className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-black">
                <option value="FORMATIVE">Formative</option>
                <option value="SUMMATIVE">Summative</option>
                <option value="MOCK">Mock</option>
                <option value="IA_DRAFT">IA draft</option>
                <option value="ORAL">Oral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pg-comment">Comment sent to family</label>
              <textarea
                id="pg-comment"
                name="comment"
                defaultValue={suggestedComment}
                rows={2}
                className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-black"
              />
            </div>
            <SubmitButton className="w-full !bg-indigo-600 hover:!bg-indigo-700 !text-white" pendingText="Publishing…">
              <Send size={14} aria-hidden /> Publish
            </SubmitButton>
            <FormFeedback state={publishState} />
          </form>
        ) : (
          <p className="text-xs text-slate-400">This submission needs to finish grading before it can be published.</p>
        )}
      </div>
    </div>
  );
}

function SubmitButtonLike({ onClick, busy, children }: { onClick: () => void; busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
    >
      {busy ? '…' : children}
    </button>
  );
}

function QuestionsTab({ submission }: { submission: SubmissionRow }) {
  const router = useRouter();
  const r = submission.result;
  const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (questionNumber: number) => {
    setBusy(true);
    const n = Number(value);
    await setTeacherOverrideQuestionScore(submission.id, questionNumber, Number.isFinite(n) ? n : null);
    setBusy(false);
    setEditing(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {r.questions.map(q => {
        const effective = getEffectiveQuestionScore(submission, q);
        const overridden = isQuestionOverridden(submission, q.number);
        return (
          <div key={q.number} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Q{q.number}</span>
              {editing === q.number ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-14 p-1 border border-indigo-400 rounded text-center text-xs font-bold bg-white dark:bg-black"
                  />
                  <span className="text-xs text-slate-400">/ {q.maxScore}</span>
                  <SubmitButtonLike onClick={() => save(q.number)} busy={busy}>Save</SubmitButtonLike>
                  <button type="button" onClick={() => setEditing(null)} className="text-xs text-slate-500">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${overridden ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300'}`}>
                    {effective}/{q.maxScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(q.number);
                      setValue(String(effective));
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit3 size={12} aria-hidden />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-1.5">{q.questionText}</p>
            <p className="text-xs font-mono bg-slate-50 dark:bg-black rounded-lg p-2.5 mb-2 whitespace-pre-wrap">{q.answerText}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{q.feedback}</p>
            {q.criteria.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800">
                {q.criteria.map(c => (
                  <div key={c.code} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-200">
                      <strong>{c.code}</strong>: {c.name}
                    </span>
                    <span className="font-mono text-slate-500">{c.score}/{c.maxScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnnotatedTab({ submission }: { submission: SubmissionRow }) {
  const [dims, setDims] = useState<Record<number, ImageDims>>({});
  const [active, setActive] = useState<string | null>(null);
  const pages = useMemo(() => submission.ocrPages ?? [], [submission.ocrPages]);
  const perPageMarks = useMemo(() => computePageMarks(pages, submission.result.annotations, dims), [pages, submission.result.annotations, dims]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(TAG_STYLE).map(([type, cls]) => (
          <span key={type} className={`px-2.5 py-1 rounded-full font-bold capitalize ${cls}`}>{type}</span>
        ))}
      </div>
      {pages.map((page, pageIndex) => {
        if (!page.imageDataUrl) return null;
        const marks = perPageMarks[pageIndex] ?? [];
        return (
          <div key={pageIndex} className="relative border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.imageDataUrl}
              alt={`Page ${pageIndex + 1}`}
              className="w-full block"
              onLoad={e => {
                const img = e.currentTarget;
                setDims(prev => ({ ...prev, [pageIndex]: { w: img.naturalWidth, h: img.naturalHeight } }));
              }}
            />
            {marks.map(m => {
              const mark = resolveMark(m.annotation, submission.result.questions);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActive(active === m.key ? null : m.key)}
                  className={`absolute border-b-2 mix-blend-multiply ${MARK_FILL[m.annotation.type]} ${MARK_BORDER[m.annotation.type]}`}
                  style={{ left: `${m.leftPct}%`, top: `${m.topPct}%`, width: `${m.widthPct}%`, height: `${m.heightPct}%` }}
                  aria-label={m.annotation.comment}
                >
                  {active === m.key && (
                    <span className={`absolute left-0 top-full mt-1 z-10 w-56 text-left normal-case whitespace-normal text-xs rounded-lg p-2.5 shadow-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200`}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 ${TAG_STYLE[m.annotation.type]}`}>
                        {m.annotation.type}{mark ? ` · ${mark.score}/${mark.maxScore}` : ''}
                      </span>
                      <span className="block">{m.annotation.comment}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
