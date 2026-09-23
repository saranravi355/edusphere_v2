/**
 * The IB Programme Standards and Practices (2020), as this school evidences
 * them.
 *
 * Static reference data, not the school's own data, so it lives in the
 * repository rather than a table: both the tag control and the dashboard want
 * it at import time, and it version-controls properly. A school-authored
 * `Standard` table can be added later without changing EvidenceTag.
 *
 * `key` is stored on every tag. NEVER renumber a key — it detaches every tag
 * that already points at it. Retire a practice by removing it and accepting
 * the orphan tags the dashboard will then report.
 *
 * This is a representative set of eighteen, not the exhaustive official list.
 * The four categories are the official ones.
 */

export type Category = "PURPOSE" | "ENVIRONMENT" | "CULTURE" | "LEARNING";

export type EvidenceKind =
  | "LESSON_PLAN"
  | "PORTFOLIO_ITEM"
  | "ASSESSMENT_RESULT"
  | "OBSERVATION"
  | "DOCUMENT";

export const CATEGORY_LABELS: Record<Category, string> = {
  PURPOSE: "Purpose",
  ENVIRONMENT: "Environment",
  CULTURE: "Culture",
  LEARNING: "Learning",
};

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  LESSON_PLAN: "Lesson plan",
  PORTFOLIO_ITEM: "Portfolio item",
  ASSESSMENT_RESULT: "Assessment",
  OBSERVATION: "Lesson observation",
  DOCUMENT: "Document",
};

export interface Practice {
  /** Stored on every tag. Stable forever. */
  key: string;
  category: Category;
  title: string;
  description: string;
  /** Evidence kinds that can plausibly satisfy this practice. Drives the picker. */
  expects: EvidenceKind[];
}

export const PRACTICES: readonly Practice[] = [
  // ── Purpose ───────────────────────────────────────────────────────────────
  // Carried by governance documents. Nothing in a classroom evidences a
  // mission statement, which is why the document register exists at all.
  {
    key: "purpose-0.1",
    category: "PURPOSE",
    title: "Mission and IB philosophy",
    description: "The school's mission aligns with IB philosophy and is published to its community.",
    expects: ["DOCUMENT"],
  },
  {
    key: "purpose-0.2",
    category: "PURPOSE",
    title: "Governance commitment",
    description: "Governing body decisions record a commitment to the programme and its resourcing.",
    expects: ["DOCUMENT"],
  },
  {
    key: "purpose-0.3",
    category: "PURPOSE",
    title: "International-mindedness",
    description: "International-mindedness is visible in stated intent and in what students do.",
    expects: ["DOCUMENT", "LESSON_PLAN", "PORTFOLIO_ITEM"],
  },

  // ── Environment ───────────────────────────────────────────────────────────
  {
    key: "environment-1.1",
    category: "ENVIRONMENT",
    title: "Leadership and structures",
    description: "Pedagogical leadership is defined and programme structures are documented.",
    expects: ["DOCUMENT"],
  },
  {
    key: "environment-1.2",
    category: "ENVIRONMENT",
    title: "Resourcing and facilities",
    description: "Staffing, time and facilities are sufficient for the programme as implemented.",
    expects: ["DOCUMENT"],
  },
  {
    key: "environment-1.3",
    category: "ENVIRONMENT",
    title: "Professional development",
    description: "Staff undertake IB professional development and it informs practice.",
    expects: ["DOCUMENT", "OBSERVATION"],
  },
  {
    key: "environment-1.4",
    category: "ENVIRONMENT",
    title: "Student support structures",
    description: "Structures exist to identify and support students' learning and wellbeing needs.",
    expects: ["DOCUMENT", "OBSERVATION"],
  },

  // ── Culture ───────────────────────────────────────────────────────────────
  {
    key: "culture-2.1",
    category: "CULTURE",
    title: "Language policy",
    description: "A language policy is current, consulted on, and reflected in teaching.",
    expects: ["DOCUMENT", "LESSON_PLAN"],
  },
  {
    key: "culture-2.2",
    category: "CULTURE",
    title: "Inclusion policy",
    description: "An inclusion policy is current and learning is differentiated in practice.",
    expects: ["DOCUMENT", "LESSON_PLAN", "OBSERVATION"],
  },
  {
    key: "culture-2.3",
    category: "CULTURE",
    title: "Assessment policy",
    description: "An assessment policy is current and assessment practice follows it.",
    expects: ["DOCUMENT", "ASSESSMENT_RESULT"],
  },
  {
    key: "culture-2.4",
    category: "CULTURE",
    title: "Academic integrity policy",
    description: "An academic integrity policy is taught, not only published.",
    expects: ["DOCUMENT", "LESSON_PLAN"],
  },
  {
    key: "culture-2.5",
    category: "CULTURE",
    title: "Safeguarding and student wellbeing",
    description: "Safeguarding is documented and pastoral practice evidences it.",
    expects: ["DOCUMENT"],
  },

  // ── Learning ──────────────────────────────────────────────────────────────
  {
    key: "learning-3.1",
    category: "LEARNING",
    title: "Written curriculum",
    description: "The written curriculum is collaboratively planned and documented across years.",
    expects: ["LESSON_PLAN", "DOCUMENT"],
  },
  {
    key: "learning-3.2",
    category: "LEARNING",
    title: "Approaches to teaching",
    description: "Teaching is inquiry-based, conceptual and differentiated, evidenced in plans and in practice.",
    expects: ["LESSON_PLAN", "OBSERVATION", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.3",
    category: "LEARNING",
    title: "Approaches to learning (ATL)",
    description: "ATL skills are explicitly planned for and developed by students.",
    expects: ["LESSON_PLAN", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.4",
    category: "LEARNING",
    title: "Assessment practice",
    description: "Assessment is criterion-related, varied, and reported against IB criteria.",
    expects: ["ASSESSMENT_RESULT", "LESSON_PLAN"],
  },
  {
    key: "learning-3.5",
    category: "LEARNING",
    title: "Feedback to students",
    description: "Students receive feedback that identifies what to do next.",
    expects: ["ASSESSMENT_RESULT", "PORTFOLIO_ITEM"],
  },
  {
    key: "learning-3.6",
    category: "LEARNING",
    title: "Student agency and reflection",
    description: "Students act on their learning and reflect on it in their own voice.",
    expects: ["PORTFOLIO_ITEM"],
  },
] as const;

export function practicesFor(kind: EvidenceKind): Practice[] {
  return PRACTICES.filter((p) => p.expects.includes(kind));
}

export function practiceByKey(key: string): Practice | undefined {
  return PRACTICES.find((p) => p.key === key);
}

export const CATEGORY_ORDER: readonly Category[] = ["PURPOSE", "ENVIRONMENT", "CULTURE", "LEARNING"];
