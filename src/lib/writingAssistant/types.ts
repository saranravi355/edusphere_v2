export type SuggestionCategory = 'clarity' | 'structure' | 'argument' | 'grammar';

export interface WritingSuggestion {
  category: SuggestionCategory;
  /** What's off, in plain language - written to the student. */
  note: string;
  /** How to fix it - concrete enough to act on, not just "be clearer". */
  suggestion: string;
  /** The exact phrase or sentence from the student's own draft this is about, when there is
   *  one to point at (a whole-piece note like "no clear thesis" may have none). */
  quote: string;
}

export interface WritingFeedback {
  /** 2-3 sentences: the overall take, before the specifics below. */
  summary: string;
  /** What's already working - always at least one, even on a rough draft. */
  strengths: string[];
  suggestions: WritingSuggestion[];
  wordCount: number;
}
