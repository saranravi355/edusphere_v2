import { practicesFor, type EvidenceKind } from "./standards";

/**
 * A tag as seen by the UI: the parts that matter for display and filtering.
 */
export interface TagView {
  id: string;
  standardKey: string;
  status: string;
  note: string | null;
}

export interface TagViewInput {
  tags: TagView[];
  kind: EvidenceKind;
  readOnly: boolean;
}

/**
 * The tags to display to the user.
 *
 * In read-only mode (student's portfolio view), show only confirmed tags.
 * Otherwise, show all tags except rejected ones.
 *
 * This is a pure function of the inputs with no DOM or database dependency,
 * so it can be unit tested independently.
 */
export function visibleTags({ tags, readOnly }: TagViewInput): TagView[] {
  if (readOnly) {
    return tags.filter((t) => t.status === "CONFIRMED");
  }
  return tags.filter((t) => t.status !== "REJECTED");
}

/**
 * The practices this record kind can evidence that are not yet tagged.
 *
 * Note: a REJECTED tag must not permanently block re-tagging that practice.
 * Only CONFIRMED and SUGGESTED tags prevent a practice from being offered.
 *
 * This is a pure function of the inputs with no DOM or database dependency,
 * so it can be unit tested independently.
 */
export function availablePractices({ tags, kind }: TagViewInput) {
  const options = practicesFor(kind);
  const alreadyTagged = new Set(
    tags.filter((t) => t.status !== "REJECTED").map((t) => t.standardKey)
  );
  return options.filter((p) => !alreadyTagged.has(p.key));
}
