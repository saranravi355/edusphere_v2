'use server';

import { guard } from '@/lib/authz';
import { getWritingFeedback } from '@/lib/writingAssistant/getFeedback';
import type { WritingFeedback } from '@/lib/writingAssistant/types';

const STUDENT_ROLES = ['STUDENT'] as const;

const MIN_WORDS = 20;
const MAX_CHARS = 12_000;

export type WritingAssistantState = { status: 'error'; error: string } | { status: 'success'; feedback: WritingFeedback } | undefined;

/** Stateless by design: nothing here is written to the database. A student's draft is their
 *  own working text, not a submission - it goes to the AI for feedback and the result renders
 *  straight back, same as the AI Tutor. If "save my feedback history" turns out to matter,
 *  that's a real follow-up (a model + this action writing to it), not something to guess at now. */
export async function getFeedbackAction(_prev: WritingAssistantState, formData: FormData): Promise<WritingAssistantState> {
  const auth = await guard(STUDENT_ROLES);
  if (!auth.ok) return { status: 'error', error: auth.error };

  const draft = String(formData.get('draft') ?? '').trim();
  const context = String(formData.get('context') ?? '').trim();

  if (!draft) return { status: 'error', error: 'Paste or type a draft first.' };
  if (draft.length > MAX_CHARS) {
    return { status: 'error', error: `That draft is a bit long for one pass (${draft.length.toLocaleString()} characters, limit ${MAX_CHARS.toLocaleString()}). Try feedback on a section at a time.` };
  }
  const wordCount = draft.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    return { status: 'error', error: `Give it a bit more to work with (at least ${MIN_WORDS} words) - a sentence or two isn't enough for useful feedback.` };
  }

  try {
    const feedback = await getWritingFeedback(draft, context);
    return { status: 'success', feedback };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Something went wrong getting feedback. Try again.' };
  }
}
