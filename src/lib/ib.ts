/**
 * IB constants shared between the student and teacher sides of Learner
 * Profile, ATL skills, and the CAS/EE/TOK core journal — one list each so a
 * value written from a teacher's form always matches what the student's page
 * knows how to label.
 */

import { IST_OFFSET_MINUTES } from "./dates";

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

/**
 * One-line descriptors for the ten attributes.
 *
 * Paraphrased rather than copied: the IB publishes its own wording for the
 * learner profile, and reproducing that text verbatim on a public page is a
 * licensing question nobody here has answered. These say the same thing in the
 * school's own voice, which is also what the IB asks schools to do.
 */
export const LEARNER_PROFILE_DESCRIPTORS: Record<string, string> = {
  INQUIRER: "We nurture our curiosity, and we learn how to learn - on our own and alongside others.",
  KNOWLEDGEABLE: "We explore ideas that matter locally and globally, and build understanding across disciplines.",
  THINKER: "We think critically and creatively about complex problems, and act on reasoned decisions.",
  COMMUNICATOR: "We express ourselves confidently in more than one language, and we listen properly to others.",
  PRINCIPLED: "We act with integrity and fairness, and we take responsibility for what we do.",
  OPEN_MINDED: "We value our own culture and history, and we are open to the perspectives of others.",
  CARING: "We show empathy and respect, and we act to make a difference to the lives of others.",
  RISK_TAKER: "We meet uncertainty with forethought and resolve, and we are resilient when things change.",
  BALANCED: "We know that intellectual, physical and emotional balance matters - to us and to those around us.",
  REFLECTIVE: "We think about the world and our own ideas, and we work to understand our strengths and limits.",
};

/**
 * The attribute to feature on a given day.
 *
 * Keyed to the IST calendar day rather than the server's, for the reason given
 * in lib/dates: the school runs on IST wherever the server happens to be, so a
 * UTC day boundary would roll this over at half past five in the morning.
 * Deterministic, so a server render and a client render on the same day agree.
 */
export function learnerProfileOfTheDay(at: Date = new Date()): {
  value: string;
  label: string;
  descriptor: string;
} {
  const istDay = Math.floor((at.getTime() + IST_OFFSET_MINUTES * 60_000) / 86_400_000);
  const i = ((istDay % LEARNER_PROFILE_ATTRIBUTES.length) + LEARNER_PROFILE_ATTRIBUTES.length) % LEARNER_PROFILE_ATTRIBUTES.length;
  const attr = LEARNER_PROFILE_ATTRIBUTES[i];
  return { value: attr.value, label: attr.label, descriptor: LEARNER_PROFILE_DESCRIPTORS[attr.value] };
}

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
