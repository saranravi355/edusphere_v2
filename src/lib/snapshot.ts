/**
 * Presentation rules for the Today's Snapshot card, kept pure so they can be
 * tested without a database. The card shows one number per tile; these decide
 * what that number is taken to mean.
 */

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
