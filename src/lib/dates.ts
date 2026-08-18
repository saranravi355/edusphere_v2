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

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

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
