/**
 * Parent-teacher consultation slots.
 *
 * The times are the school's, not the server's. A 16:00 slot in Bengaluru is
 * 10:30 UTC, so the conversion has to be explicit — storing "16:00" against the
 * server's clock would move every appointment by five and a half hours.
 */
import { IST_OFFSET_MINUTES } from "@/lib/dates";

export const MEETING_MINUTES = 15;

/** Consultation window: 16:00–17:45, in 15-minute slots. */
export const MEETING_SLOTS = [
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
] as const;

/** Combine a yyyy-mm-dd date and an HH:mm school-local slot into a UTC instant. */
export function slotToUtc(date: string, slot: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!(MEETING_SLOTS as readonly string[]).includes(slot)) return null;

  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = slot.split(":").map(Number);
  const asIfUtc = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  const instant = new Date(asIfUtc - IST_OFFSET_MINUTES * 60_000);
  return isNaN(instant.getTime()) ? null : instant;
}

/** The school-local HH:mm a stored instant falls on. */
export function utcToSlot(at: Date): string {
  const local = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  return `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
}

/** yyyy-mm-dd for a date offset from today, in the school's own day. */
export function schoolDateString(daysFromToday = 0): string {
  const local = new Date(Date.now() + IST_OFFSET_MINUTES * 60_000 + daysFromToday * 86_400_000);
  return local.toISOString().slice(0, 10);
}
