import prisma from "@/lib/prisma";

/** The two registers taken each day. `FULL_DAY` is the legacy single mark. */
export const SESSIONS = ["MORNING", "AFTERNOON"] as const;
export type AttendanceSession = (typeof SESSIONS)[number];

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;


export type Presence = {
  present: number;
  total: number;
  /** Fraction present, or null when nothing has been recorded yet. */
  ratio: number | null;
};

/**
 * Attendance percentages for a set of students, counted in the database.
 *
 * Attendance is the fastest-growing table in the schema — one row per student
 * per school day — so any page that loaded `attendances: true` just to call
 * .length on it got slower every single day the school was open. Three pages
 * did exactly that. This is the one way to ask the question.
 *
 * `ratio` is null rather than 1 when there are no records, because "term has
 * not started" and "perfect attendance" are not the same thing and the registry
 * used to show the first as the second.
 */
export async function presenceByStudent(studentIds: string[]): Promise<Map<string, Presence>> {
  const out = new Map<string, Presence>();
  if (!studentIds.length) return out;

  const grouped = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: { studentId: { in: studentIds } },
    _count: { _all: true },
  });

  for (const g of grouped) {
    const cur = out.get(g.studentId) ?? { present: 0, total: 0, ratio: null };
    cur.total += g._count._all;
    if (g.status === "PRESENT") cur.present += g._count._all;
    out.set(g.studentId, cur);
  }
  for (const p of out.values()) p.ratio = p.total > 0 ? p.present / p.total : null;

  for (const id of studentIds) {
    if (!out.has(id)) out.set(id, { present: 0, total: 0, ratio: null });
  }
  return out;
}
