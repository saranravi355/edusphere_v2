import { callWithFailover } from '../ai/pool';
import { buildWritingFeedbackPrompt } from './prompt';
import type { SuggestionCategory, WritingFeedback, WritingSuggestion } from './types';

const CATEGORIES: SuggestionCategory[] = ['clarity', 'structure', 'argument', 'grammar'];

function normalizeSuggestions(raw: unknown): WritingSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map(s => ({
      category: CATEGORIES.includes(s.category as SuggestionCategory) ? (s.category as SuggestionCategory) : 'clarity',
      note: typeof s.note === 'string' ? s.note : '',
      suggestion: typeof s.suggestion === 'string' ? s.suggestion : '',
      quote: typeof s.quote === 'string' ? s.quote : ''
    }))
    .filter(s => s.note.length > 0 || s.suggestion.length > 0);
}

function fallbackWordCount(draft: string): number {
  return draft.trim().split(/\s+/).filter(Boolean).length;
}

/** Same defensive-parse shape as grading/parseGradingResponse.ts: strip a markdown fence if
 *  the model added one anyway, fall back to extracting the outermost {...} if JSON.parse fails
 *  outright, then normalize every field rather than trusting the raw shape. */
export function parseWritingFeedback(rawText: string, draft: string): WritingFeedback {
  let cleaned = rawText.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        parsed = JSON.parse(braceMatch[0]);
      } catch {
        // fall through to the error below
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Could not parse the AI's feedback response. Try again.");
  }

  const p = parsed as Partial<WritingFeedback>;
  return {
    summary: typeof p.summary === 'string' ? p.summary : '',
    strengths: Array.isArray(p.strengths) ? p.strengths.filter((s): s is string => typeof s === 'string') : [],
    suggestions: normalizeSuggestions(p.suggestions),
    wordCount: typeof p.wordCount === 'number' && p.wordCount > 0 ? p.wordCount : fallbackWordCount(draft)
  };
}

export async function getWritingFeedback(draft: string, context: string): Promise<WritingFeedback> {
  const prompt = buildWritingFeedbackPrompt(draft, context);
  const text = (await callWithFailover(prompt, true)).text;
  return parseWritingFeedback(text, draft);
}
