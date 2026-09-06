import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Honorifics that are not anybody's first name.
 *
 * Stored without the full stop and lower-cased; the comparison strips both.
 * Indian titles are here alongside the English ones because the staff list has
 * them: Shri, Smt, Sri.
 */
const HONORIFICS = new Set([
  "dr", "mr", "mrs", "ms", "miss", "mx", "prof", "professor",
  "shri", "sri", "smt", "sir", "madam", "rev", "fr",
]);

/**
 * The name to greet somebody by.
 *
 * Every portal welcomed people with `name.split(" ")[0]`, which is correct right
 * up until a name carries a title — and the Principal's is "Dr. Meena Krishnan",
 * so the dashboard opened with "Welcome back, Dr." every morning. This skips any
 * leading honorific and returns the first word that is actually part of the name.
 *
 * A name consisting only of a title falls back to the first word rather than to
 * nothing, on the grounds that greeting somebody by their title beats greeting
 * them by an empty string.
 */
export function firstName(full: string | null | undefined, fallback = ""): string {
  if (!full) return fallback;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  for (const part of parts) {
    if (!HONORIFICS.has(part.replace(/\.$/, "").toLowerCase())) return part;
  }
  return parts[0];
}
