import type { EvidenceKind } from "./standards";

/**
 * The five nullable foreign keys on EvidenceTag, exactly one of which is set.
 *
 * Structurally compatible with the Prisma row rather than importing its type,
 * so this module stays a pure function with a plain-object test.
 */
export interface TagSourceColumns {
  lessonPlanId?: string | null;
  portfolioItemId?: string | null;
  assessmentResultId?: string | null;
  observationId?: string | null;
  documentId?: string | null;
}

const COLUMNS: readonly [keyof TagSourceColumns, EvidenceKind][] = [
  ["lessonPlanId", "LESSON_PLAN"],
  ["portfolioItemId", "PORTFOLIO_ITEM"],
  ["assessmentResultId", "ASSESSMENT_RESULT"],
  ["observationId", "OBSERVATION"],
  ["documentId", "DOCUMENT"],
];

export function columnFor(kind: EvidenceKind): keyof TagSourceColumns {
  const found = COLUMNS.find(([, k]) => k === kind);
  if (!found) throw new Error(`Unknown evidence kind: ${kind}`);
  return found[0];
}

/**
 * The one record a tag points at.
 *
 * Throws rather than returning null on either failure. A tag with no source,
 * or with two, means the check constraint in the migration was bypassed — so
 * the coverage figures are already wrong and the loud failure is the cheapest
 * way to find out. This is never reachable from user input.
 */
export function sourceOf(tag: TagSourceColumns): { kind: EvidenceKind; id: string } {
  const set = COLUMNS.flatMap(([column, kind]) => {
    const id = tag[column];
    return id ? [{ kind, id }] : [];
  });

  if (set.length === 0) throw new Error("EvidenceTag has no source record set");
  if (set.length > 1) {
    throw new Error(
      `EvidenceTag has more than one source set: ${set.map((s) => s.kind).join(", ")}`,
    );
  }
  return set[0];
}
