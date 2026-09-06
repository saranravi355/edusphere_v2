/**
 * The IB subjects this school actually teaches, and the terms it grades in.
 *
 * Taken from the 606 IBSubjectRecord rows already on file rather than invented:
 * every name below appears in the register, with the group and levels it is
 * recorded under. It exists so a teacher creating a record for a student who
 * has none can pick a subject from a list instead of typing a name that will
 * not match the 200 rows already using a slightly different one.
 *
 * `subjectGroup` on a new record is NOT taken from here when the school already
 * has a row for that subject — see resolveSubjectShape() in the ib-records
 * action, which copies the group and level from the existing rows. The seeded
 * MYP records mostly sit under group 1 rather than the MYP group numbers, and
 * a new record that disagreed with them would split that subject in two on the
 * Analytics "grade by subject group" chart. Consistency with what is there
 * beats correctness in the abstract; a backfill can fix both at once later.
 */

export type Programme = "DP" | "MYP";

export interface IbSubject {
  name: string;
  /** Fallback only, for a subject with no existing record to copy from. */
  group: number;
  programme: Programme;
  /** DP subjects are taught at Higher or Standard level; MYP is neither. */
  levels: readonly string[];
}

export const IB_SUBJECTS: readonly IbSubject[] = [
  // Diploma Programme
  { name: "English A: Language & Literature", group: 1, programme: "DP", levels: ["HL", "SL"] },
  { name: "English A: Literature", group: 1, programme: "DP", levels: ["HL", "SL"] },
  { name: "French B", group: 2, programme: "DP", levels: ["HL", "SL"] },
  { name: "Spanish B", group: 2, programme: "DP", levels: ["HL", "SL"] },
  { name: "Business Management", group: 3, programme: "DP", levels: ["HL", "SL"] },
  { name: "Economics", group: 3, programme: "DP", levels: ["HL", "SL"] },
  { name: "Biology", group: 4, programme: "DP", levels: ["HL", "SL"] },
  { name: "Chemistry", group: 4, programme: "DP", levels: ["HL", "SL"] },
  { name: "Physics", group: 4, programme: "DP", levels: ["HL", "SL"] },
  { name: "Mathematics: Analysis & Approaches", group: 5, programme: "DP", levels: ["HL", "SL"] },
  { name: "Mathematics: Applications & Interpretation", group: 5, programme: "DP", levels: ["HL", "SL"] },
  { name: "Visual Arts", group: 6, programme: "DP", levels: ["HL", "SL"] },

  // Middle Years Programme
  { name: "Language & Literature", group: 1, programme: "MYP", levels: ["MYP"] },
  { name: "Language Acquisition: Spanish", group: 2, programme: "MYP", levels: ["MYP"] },
  { name: "Individuals & Societies", group: 3, programme: "MYP", levels: ["MYP"] },
  { name: "Sciences", group: 4, programme: "MYP", levels: ["MYP"] },
  { name: "Mathematics", group: 5, programme: "MYP", levels: ["MYP"] },
  { name: "Arts", group: 6, programme: "MYP", levels: ["MYP"] },
  { name: "Physical & Health Education", group: 6, programme: "MYP", levels: ["MYP"] },
  { name: "Design", group: 6, programme: "MYP", levels: ["MYP"] },
];

export function subjectsFor(programme: Programme): readonly IbSubject[] {
  return IB_SUBJECTS.filter((s) => s.programme === programme);
}

export function findSubject(name: string): IbSubject | undefined {
  return IB_SUBJECTS.find((s) => s.name === name);
}

/**
 * The terms the school grades in.
 *
 * Every one of the 606 records on file is in a single term, so this is the list
 * a teacher chooses from rather than a free-text box that would fragment the
 * register the first time somebody typed "Term 1, 2026-27".
 */
export const IB_TERMS = ["Term 1 2026-27", "Term 2 2026-27", "Term 3 2026-27"] as const;

/** IB awards 1–7 per subject; MYP marks four criteria out of 8 each. */
export const GRADE_MIN = 1;
export const GRADE_MAX = 7;
export const CRITERION_MIN = 0;
export const CRITERION_MAX = 8;
export const CRITERIA = ["A", "B", "C", "D"] as const;
