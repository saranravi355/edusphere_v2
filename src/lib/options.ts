/**
 * Fixed option lists shared between a page's form and its server action.
 *
 * They live here rather than beside the actions because a file marked
 * `"use server"` may only export async functions — exporting a constant from
 * one is a build error, not a lint nit. Keeping them in one plain module also
 * means the `<select>` and the validation that checks it can never disagree.
 */

export const ASSET_CATEGORIES = [
  "LAPTOP", "IPAD", "PROJECTOR", "LAB_EQUIPMENT", "CAMERA", "OTHER",
] as const;

export const CLUB_ACTIVITY_TYPES = [
  "MEETING", "COMPETITION", "WORKSHOP", "TRIP", "SERVICE", "EVENT",
] as const;

export const BOOK_CATEGORIES = [
  "TEXTBOOK", "FICTION", "NON_FICTION", "REFERENCE", "PAST_PAPERS", "GENERAL",
] as const;

/** How long a library book can be kept, in days. */
export const LOAN_DAYS = 14;

/** Title-cases a SCREAMING_SNAKE option for display. */
export function prettyOption(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
