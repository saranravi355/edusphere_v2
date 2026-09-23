import { ADMIN_ROLES } from "@/lib/authz";
import type { EvidenceKind } from "./standards";

/**
 * The facts mayTag() in actions.ts gathers from Prisma before it can decide
 * whether this caller may tag this record. Deliberately free of Prisma and of
 * any I/O — the decision itself is pure, only the lookups that feed it are
 * not, so this is the part that can be unit tested without a database.
 */
export interface TagPermissionFacts {
  role: string;
  kind: EvidenceKind;
  /** Whether the caller has a Teacher profile at all. */
  isTeacher: boolean;
  /** For LESSON_PLAN: does the plan belong to this caller? */
  ownsLessonPlan?: boolean;
  /** For PORTFOLIO_ITEM / ASSESSMENT_RESULT: the record's student's classroom, or null. */
  recordClassroomId?: string | null;
  /** Classrooms this caller teaches, by homeroom or timetable. */
  classroomIds?: string[];
}

/**
 * Whether this caller may tag this particular record.
 *
 * A role check alone is not enough. Without the ownership half, any teacher
 * could tag any other teacher's lesson plan, or any of the 173 children's
 * portfolio items, by posting an id — the same hole ownPlan() closes in the
 * planner's own actions.
 *
 * The `default: return false` is deliberate, not decorative: `kind` is typed
 * EvidenceKind, but the whole point of this module (see actions.ts's own
 * header comment) is that a raw POST can send any string. An unrecognised
 * kind must deny, not fall through into a branch it doesn't belong to.
 */
export function mayTagRecord(facts: TagPermissionFacts): boolean {
  if ((ADMIN_ROLES as readonly string[]).includes(facts.role)) return true;

  switch (facts.kind) {
    // Documents are the coordinator's register; a teacher has no business
    // tagging one even though they may tag their own classroom records.
    case "DOCUMENT":
      return false;

    // Observations are written about a teacher by an observer. A teacher
    // tagging their own observation as evidence of their own practice is the
    // self-assessment the confirm step exists to catch, so it is refused
    // outright rather than queued.
    case "OBSERVATION":
      return false;

    case "LESSON_PLAN":
      return facts.isTeacher && facts.ownsLessonPlan === true;

    // Portfolio items and assessment results belong to a student, so the
    // test is whether this teacher teaches that student — the same rule the
    // teacher's student profile applies.
    case "PORTFOLIO_ITEM":
    case "ASSESSMENT_RESULT": {
      const classroomIds = facts.classroomIds ?? [];
      return (
        facts.isTeacher &&
        classroomIds.length > 0 &&
        !!facts.recordClassroomId &&
        classroomIds.includes(facts.recordClassroomId)
      );
    }

    default:
      return false;
  }
}
