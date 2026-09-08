/**
 * IB constants shared between the student and teacher sides of Learner
 * Profile, ATL skills, and the CAS/EE/TOK core journal — one list each so a
 * value written from a teacher's form always matches what the student's page
 * knows how to label.
 */

export const LEARNER_PROFILE_ATTRIBUTES = [
  { value: "INQUIRER", label: "Inquirer" },
  { value: "KNOWLEDGEABLE", label: "Knowledgeable" },
  { value: "THINKER", label: "Thinker" },
  { value: "COMMUNICATOR", label: "Communicator" },
  { value: "PRINCIPLED", label: "Principled" },
  { value: "OPEN_MINDED", label: "Open-minded" },
  { value: "CARING", label: "Caring" },
  { value: "RISK_TAKER", label: "Risk-taker" },
  { value: "BALANCED", label: "Balanced" },
  { value: "REFLECTIVE", label: "Reflective" },
] as const;

export function learnerProfileLabel(value: string): string {
  return LEARNER_PROFILE_ATTRIBUTES.find((a) => a.value === value)?.label ?? value;
}

export const ATL_CATEGORIES = [
  { value: "RESEARCH", label: "Research" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "SOCIAL", label: "Social" },
  { value: "SELF_MANAGEMENT", label: "Self-management" },
  { value: "THINKING", label: "Thinking" },
] as const;

export function atlCategoryLabel(value: string): string {
  return ATL_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const ATL_RATING_LABELS = ["", "Novice", "Learner", "Practitioner", "Expert"] as const;

export const CAS_STRANDS = [
  { value: "CREATIVITY", label: "Creativity", field: "creativityHours" },
  { value: "ACTIVITY", label: "Activity", field: "activityHours" },
  { value: "SERVICE", label: "Service", field: "serviceHours" },
] as const;

export function casStrandLabel(value: string): string {
  return CAS_STRANDS.find((s) => s.value === value)?.label ?? value;
}

/** School benchmark: hours per strand, and reflections, over the DP. Shared with admin/programmes/cas. */
export const CAS_STRAND_TARGET_HOURS = 50;
export const CAS_REFLECTION_TARGET = 15;

export const IB_CORE_ELEMENTS = ["CAS", "EE", "TOK"] as const;
export type IBCoreElement = (typeof IB_CORE_ELEMENTS)[number];

export const IB_CORE_ELEMENT_LABELS: Record<IBCoreElement, string> = {
  CAS: "Creativity, Activity, Service",
  EE: "Extended Essay",
  TOK: "Theory of Knowledge",
};
