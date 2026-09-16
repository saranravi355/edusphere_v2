import { IST_OFFSET_MINUTES } from "@/lib/dates";

/**
 * Presentation rules for the Today's Snapshot card, kept pure so they can be
 * tested without a database. The card shows one number per tile; these decide
 * what that number is taken to mean.
 */

/** Day of the week in the school's time zone, 0 = Sunday … 6 = Saturday. */
export function schoolWeekday(at: Date = new Date()): number {
  return new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000).getUTCDay();
}

/**
 * A zero on a Sunday is a fact about the calendar, not a gap in the timetable,
 * and the card used to draw both as the same bare "0".
 */
export function classesCaption(count: number, weekday: number): string {
  if (count > 0) return "View timetable";
  return weekday === 0 || weekday === 6 ? "No school today" : "Nothing timetabled";
}

/** Whole rupees with Indian digit grouping: ₹2,547 and ₹12,34,567. */
export function rupees(amount: number): string {
  const whole = Math.round(amount);
  const grouped = Math.abs(whole).toLocaleString("en-IN");
  return whole < 0 ? `-₹${grouped}` : `₹${grouped}`;
}
