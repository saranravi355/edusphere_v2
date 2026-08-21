/**
 * Staff leave policy.
 *
 * These entitlements are school policy, not per-contract data — there is no
 * column on Teacher holding an individual allowance, so they live here where
 * one edit changes every screen, rather than being written into the page as
 * "12 / 15" the way they used to be.
 *
 * A day counted here is a working day. Counting calendar days would charge a
 * teacher two days of casual leave for a Friday-to-Monday absence.
 */
export const LEAVE_TYPES = [
  { value: "CASUAL", label: "Casual leave", short: "CL", entitlement: 15 },
  { value: "SICK", label: "Sick leave", short: "SL", entitlement: 10 },
  { value: "EARNED", label: "Earned leave", short: "EL", entitlement: 5 },
  { value: "UNPAID", label: "Unpaid leave", short: "LWP", entitlement: null },
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number]["value"];

export const LEAVE_TYPE_VALUES = LEAVE_TYPES.map((t) => t.value) as readonly string[];

export function leaveTypeLabel(value: string): string {
  return LEAVE_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Working days (Mon–Fri) between two dates, inclusive. Minimum 0. */
export function workingDaysBetween(start: Date, end: Date): number {
  if (end < start) return 0;
  let days = 0;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (cursor.getTime() <= last) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

type Countable = { leaveType: string; status: string; startDate: Date; endDate: Date };

/**
 * Days taken per type. A pending request counts against the balance — a
 * teacher planning a second absence needs to see the first one reserved, not
 * discover it when both are approved.
 */
export function daysTakenByType(requests: Countable[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of requests) {
    if (r.status === "REJECTED") continue;
    out[r.leaveType] = (out[r.leaveType] ?? 0) + workingDaysBetween(r.startDate, r.endDate);
  }
  return out;
}
