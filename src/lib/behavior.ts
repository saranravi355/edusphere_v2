/**
 * Behaviour categories and what each is worth.
 *
 * These lived in two places and disagreed. The admin dialog offered a free
 * points box with no categories at all; the teacher screen offered categories
 * with the points baked into the label ("Disrupting Class (-3 pts)") and read
 * neither. Both write BehaviorIncident, so both use this.
 *
 * Points are stored signed: merits positive, demerits negative, so a conduct
 * total is a plain sum. Seeded rows predate that convention and are
 * inconsistent, which is why aggregates group by `type` rather than by sign.
 */
export const BEHAVIOR_CATEGORIES = [
  { value: "Leadership", label: "Outstanding leadership", type: "MERIT", points: 5 },
  { value: "Helpfulness", label: "Helping a peer", type: "MERIT", points: 3 },
  { value: "Academic Excellence", label: "Exceptional project work", type: "MERIT", points: 5 },
  { value: "Participation", label: "Strong participation", type: "MERIT", points: 3 },
  { value: "Service", label: "Service to the school", type: "MERIT", points: 3 },
  { value: "Sportsmanship", label: "Sportsmanship", type: "MERIT", points: 3 },

  { value: "Conduct", label: "Disrupting class", type: "DEMERIT", points: 3 },
  { value: "Discipline", label: "Bullying or harassment", type: "DEMERIT", points: 10 },
  { value: "Academic Dishonesty", label: "Academic dishonesty", type: "DEMERIT", points: 15 },
  { value: "Attendance", label: "Unexcused absence", type: "DEMERIT", points: 5 },
  { value: "Homework", label: "Repeated missing homework", type: "DEMERIT", points: 3 },
  { value: "Uniform", label: "Uniform", type: "DEMERIT", points: 2 },
] as const;

export type BehaviorCategory = (typeof BEHAVIOR_CATEGORIES)[number];

export const MERIT_CATEGORIES = BEHAVIOR_CATEGORIES.filter((c) => c.type === "MERIT");
export const DEMERIT_CATEGORIES = BEHAVIOR_CATEGORIES.filter((c) => c.type === "DEMERIT");

export function findCategory(value: string): BehaviorCategory | undefined {
  return BEHAVIOR_CATEGORIES.find((c) => c.value === value);
}

/**
 * The point total at which a student's conduct needs a conversation. Used to
 * decide whether the escalation banner appears at all — it used to be static
 * markup naming a student who was not in the data.
 */
export const ESCALATION_THRESHOLD = -20;

/** Signed total for a set of incidents, using `type` rather than stored sign. */
export function conductTotal(incidents: { type: string; points: number }[]): number {
  return incidents.reduce((sum, i) => sum + (i.type === "DEMERIT" ? -Math.abs(i.points) : Math.abs(i.points)), 0);
}
