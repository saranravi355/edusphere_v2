/**
 * Deterministic date formatting for anything rendered in a Client Component.
 *
 * Why this exists: `toLocaleDateString` output depends on the runtime's ICU/CLDR
 * data, and Node's differs from the browser's. Node 22 ships ICU 78, where the
 * en-GB "weekday day month" pattern has no comma; Chromium's older CLDR still
 * has one. So the server renders "Fri 10 Jul" and the browser renders
 * "Fri, 10 Jul" — for the same instant, same locale, same time zone. React sees
 * the difference during hydration and throws (minified error #418), and the
 * mismatch silently appears or disappears as Node or the browser is upgraded.
 *
 * Pinning the locale and the time zone does NOT fix this; only formatting the
 * string ourselves does. These helpers produce byte-identical output on both
 * sides.
 *
 * Everything is rendered in IST, since the school runs on IST regardless of
 * where the server or the reader is.
 */

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/**
 * The school's UTC offset in minutes. Exported so "today" can be computed in
 * the school's own day rather than the server's — a register marked at 9am in
 * Bengaluru is 03:30 UTC, and a naive UTC day boundary would file the first two
 * lessons of every morning under the previous date.
 */
export const IST_OFFSET_MINUTES = 330;

const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

function istParts(input: Date | string | number) {
  const t = new Date(new Date(input).getTime() + IST_OFFSET_MS);
  return {
    weekday: t.getUTCDay(),
    day: t.getUTCDate(),
    month: t.getUTCMonth(),
    year: t.getUTCFullYear(),
    hour: t.getUTCHours(),
    minute: t.getUTCMinutes(),
    second: t.getUTCSeconds(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export type DateStyle =
  | "ddmmyyyy"        // 10/07/2026   (en-GB default)
  | "dMonYyyy"        // 10 Jul 2026
  | "dMonYy"          // 10 Jul 26
  | "dMon"            // 10 Jul
  | "weekdayDMon"     // Fri, 10 Jul
  | "weekday"         // Fri
  | "monthYear";      // July 2026

export function formatDate(input: Date | string | number | null | undefined, style: DateStyle = "ddmmyyyy"): string {
  if (input === null || input === undefined) return "";
  const p = istParts(input);
  if (Number.isNaN(p.year)) return "";
  switch (style) {
    case "dMonYyyy":    return `${p.day} ${MONTH_SHORT[p.month]} ${p.year}`;
    case "dMonYy":      return `${p.day} ${MONTH_SHORT[p.month]} ${String(p.year).slice(-2)}`;
    case "dMon":        return `${p.day} ${MONTH_SHORT[p.month]}`;
    case "weekdayDMon": return `${WEEKDAY_SHORT[p.weekday]}, ${p.day} ${MONTH_SHORT[p.month]}`;
    case "weekday":     return WEEKDAY_SHORT[p.weekday];
    case "monthYear":   return `${MONTH_LONG[p.month]} ${p.year}`;
    default:            return `${pad(p.day)}/${pad(p.month + 1)}/${p.year}`;
  }
}

/** 24-hour clock, IST. `withSeconds` gives HH:MM:SS. */
export function formatTime(input: Date | string | number | null | undefined, withSeconds = false): string {
  if (input === null || input === undefined) return "";
  const p = istParts(input);
  if (Number.isNaN(p.year)) return "";
  return withSeconds
    ? `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`
    : `${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * The school's day as a pair of UTC instants: midnight to midnight in
 * Asia/Kolkata. A register marked at 9am in Bengaluru is 03:30 UTC, so a naive
 * UTC day boundary files the first two lessons of every morning under the
 * previous date.
 */
export function schoolDay(at: Date = new Date()): { start: Date; end: Date } {
  const local = new Date(at.getTime() + IST_OFFSET_MS);
  const start = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST_OFFSET_MS,
  );
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
