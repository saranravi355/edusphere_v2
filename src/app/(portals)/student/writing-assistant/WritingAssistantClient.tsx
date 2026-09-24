'use client';

import { useActionState, useState } from 'react';
import { PenLine, Sparkles, AlertCircle, CheckCircle2, Quote, Eye } from 'lucide-react';
import { SubmitButton } from '@/components/ui/form';
import { getFeedbackAction } from './actions';
import type { SuggestionCategory } from '@/lib/writingAssistant/types';

const CATEGORY_LABEL: Record<SuggestionCategory, string> = {
  clarity: 'Clarity',
  structure: 'Structure',
  argument: 'Argument',
  grammar: 'Grammar'
};

const CATEGORY_STYLE: Record<SuggestionCategory, string> = {
  clarity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  structure: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  argument: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  grammar: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
};

const input =
  'w-full p-2.5 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-black ' +
  'text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';

export default function WritingAssistantClient() {
  const [state, action] = useActionState(getFeedbackAction, undefined);
  const [draft, setDraft] = useState('');
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <form action={action} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="wa-context">
            What&apos;s this for? <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="wa-context"
            name="context"
            placeholder="e.g. English Lang &amp; Lit essay, History IA introduction, TOK exhibition commentary"
            className={input}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-500" htmlFor="wa-draft">Your draft</label>
            <span className="text-xs text-slate-400">{wordCount} word{wordCount === 1 ? '' : 's'}</span>
          </div>
          <textarea
            id="wa-draft"
            name="draft"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            required
            rows={14}
            placeholder="Paste or type a paragraph, section, or full draft here…"
            className={`${input} font-normal leading-relaxed resize-y`}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Works best with at least a few paragraphs — a single sentence won&apos;t give the assistant much to go on.
          </p>
        </div>

        <SubmitButton pendingText="Reading your draft…" className="w-full !bg-primary hover:!opacity-90 !text-white !rounded-xl">
          <Sparkles size={16} aria-hidden /> Get Feedback
        </SubmitButton>

        {state?.status === 'error' && (
          <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2.5 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {state.error}
          </div>
        )}
      </form>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[300px]">
        {state?.status === 'success' ? (
          <FeedbackView feedback={state.feedback} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <PenLine size={26} className="text-primary" aria-hidden />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-200">No feedback yet</p>
            <p className="text-sm text-slate-400 max-w-xs mt-1">
              Paste a draft and run the assistant to get feedback on clarity, structure, argument and grammar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackView({ feedback }: { feedback: import('@/lib/writingAssistant/types').WritingFeedback }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" aria-hidden />
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{feedback.summary}</p>
      </div>

      {feedback.strengths.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">What&apos;s working</p>
          <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200 list-disc list-inside">
            {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {feedback.suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suggestions</p>
          {feedback.suggestions.map((s, i) => (
            <div key={i} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_STYLE[s.category]}`}>
                {CATEGORY_LABEL[s.category]}
              </span>
              {s.quote && (
                <p className="flex items-start gap-1.5 text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-zinc-700 pl-2.5">
                  <Quote size={12} className="mt-0.5 shrink-0" aria-hidden />
                  &ldquo;{s.quote}&rdquo;
                </p>
              )}
              {s.note && <p className="text-sm text-slate-700 dark:text-slate-200">{s.note}</p>}
              {s.suggestion && (
                <p className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <Eye size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  {s.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800">
        {feedback.wordCount} word{feedback.wordCount === 1 ? '' : 's'} reviewed. This is formative feedback to help you revise — not a grade or a submission record.
      </p>
    </div>
  );
}
