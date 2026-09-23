import { academicYearOf } from "@/lib/dates";
import { PRACTICES, practiceByKey, type EvidenceKind } from "./standards";

/**
 * How well evidenced a practice is.
 *
 * Deliberately three buckets, not a score. A visiting team asks "show me the
 * evidence for this practice", not "what is your coverage percentage".
 */
export type Tone = "GAP" | "THIN" | "WELL_EVIDENCED";

/**
 * The minimum a tag has to carry for classification. A narrow interface so
 * this module never depends on the Prisma row shape and stays testable with
 * plain objects.
 */
export interface TagFact {
  standardKey: string;
  kind: EvidenceKind;
  status: string;
  taggedAt: Date;
}

const CONFIRMED = "CONFIRMED";

/**
 * GAP           — nothing confirmed.
 * THIN          — one or two confirmed, OR all from a single evidence kind,
 *                 OR nothing from the current academic year.
 * WELL_EVIDENCED— three or more, across two or more kinds, at least one current.
 *
 * The single-kind rule is the one that matters. A practice evidenced five
 * times by five lesson plans and nothing else is one teacher's account of
 * their own room; it is not evidence that the practice is embedded, and the
 * rule says so without anyone writing prose about it.
 */
export function classifyCoverage(tags: TagFact[], now: Date = new Date()): Tone {
  const confirmed = tags.filter((t) => t.status === CONFIRMED);
  if (confirmed.length === 0) return "GAP";
  if (confirmed.length < 3) return "THIN";

  const kinds = new Set(confirmed.map((t) => t.kind));
  if (kinds.size < 2) return "THIN";

  const thisYear = academicYearOf(now);
  const hasCurrent = confirmed.some((t) => academicYearOf(t.taggedAt) === thisYear);
  if (!hasCurrent) return "THIN";

  return "WELL_EVIDENCED";
}

export interface CoverageSummary {
  byPractice: Map<string, { tone: Tone; count: number }>;
  wellEvidenced: number;
  thin: number;
  gaps: number;
  /**
   * Keys found on tags that no longer exist in the taxonomy. Surfaced rather
   * than dropped: a retired or mistyped key would otherwise show up only as an
   * unexplained undercount.
   */
  orphanKeys: string[];
}

export function coverageSummary(tags: TagFact[], now: Date = new Date()): CoverageSummary {
  const grouped = new Map<string, TagFact[]>();
  for (const t of tags) {
    const list = grouped.get(t.standardKey);
    if (list) list.push(t);
    else grouped.set(t.standardKey, [t]);
  }

  const byPractice = new Map<string, { tone: Tone; count: number }>();
  let wellEvidenced = 0;
  let thin = 0;
  let gaps = 0;

  // Every practice gets a row, including untagged ones — a practice missing
  // from the dashboard reads as "fine" when it is the opposite.
  for (const practice of PRACTICES) {
    const own = grouped.get(practice.key) ?? [];
    const tone = classifyCoverage(own, now);
    const count = own.filter((t) => t.status === CONFIRMED).length;
    byPractice.set(practice.key, { tone, count });
    if (tone === "WELL_EVIDENCED") wellEvidenced++;
    else if (tone === "THIN") thin++;
    else gaps++;
  }

  const orphanKeys = [...grouped.keys()].filter((k) => !practiceByKey(k));

  return { byPractice, wellEvidenced, thin, gaps, orphanKeys };
}

export const TONE_META: Record<Tone, { label: string; cls: string }> = {
  WELL_EVIDENCED: {
    label: "Well evidenced",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  THIN: {
    label: "Thin",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  GAP: {
    label: "Gap",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};
