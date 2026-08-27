import prisma from "@/lib/prisma";
import { IST_OFFSET_MINUTES, schoolDay } from "@/lib/dates";

/** The two registers taken each day. `FULL_DAY` is the legacy single mark. */
export const SESSIONS = ["MORNING", "AFTERNOON"] as const;
export type AttendanceSession = (typeof SESSIONS)[number];

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60_000;

/**
 * The canonical `date` for a register mark: midnight UTC on the Bengaluru
 * calendar date the mark belongs to.
 *
 * Every row used to store `new Date()` — the instant the button was pressed —
 * so two marks for the same child on the same day held different values and
 * nothing could express "one row per register". Half the table sat at 08:15
 * from a bulk seed and the rest at whatever o'clock a teacher tapped.
 *
 * Midnight UTC rather than IST midnight is deliberate. IST midnight is 18:30
 * UTC the previous day, which would make `date::date` in SQL and
 * `toISOString().slice(0, 10)` in JS both report the day before — and the
 * analytics grouping does exactly that. Midnight UTC of the IST date reads
 * correctly in both, and still falls inside schoolDay()'s window for that day.
 */
export function registerDate(at: Date = new Date()): Date {
  const local = new Date(at.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/**
 * Mark one student for one session, or clear the mark by repeating it.
 *
 * There were three copies of this logic — the attendance screen, the teacher
 * dashboard, and an older action — and they disagreed. The oldest computed
 * "today" with `setHours(0, 0, 0, 0)`, which is the SERVER's midnight (05:30
 * IST on a UTC host), matched `date: { gte: today }` with no upper bound so it
 * could pick up a future row, and ignored `session` entirely — so marking the
 * afternoon register could silently overwrite the morning one, or miss it and
 * append a second row for the same day. That is how students ended up marked
 * both PRESENT and ABSENT on 18 and 19 June.
 *
 * One copy now, and the unique index added in the same migration makes a
 * duplicate impossible even if a fourth caller appears.
 */
export async function markOne(opts: {
  studentId: string;
  status: string;
  session: string;
  recordedBy: string;
  /** Repeating the same status clears it, so a mis-tap is correctable. */
  toggle?: boolean;
}): Promise<void> {
  const { studentId, status, session, recordedBy, toggle = false } = opts;
  const { start, end } = schoolDay();

  const existing = await prisma.attendance.findFirst({
    where: { studentId, session, date: { gte: start, lt: end } },
    select: { id: true, status: true },
  });

  if (!existing) {
    await prisma.attendance.create({
      data: { studentId, status, session, date: registerDate(), recordedBy },
    });
    return;
  }
  if (toggle && existing.status === status) {
    await prisma.attendance.delete({ where: { id: existing.id } });
    return;
  }
  await prisma.attendance.update({ where: { id: existing.id }, data: { status, recordedBy } });
}

/** Mark a whole class present for a session, skipping anyone already marked. */
export async function markManyPresent(opts: {
  studentIds: string[];
  session: string;
  recordedBy: string;
}): Promise<number> {
  const { studentIds, session, recordedBy } = opts;
  if (!studentIds.length) return 0;

  const { start, end } = schoolDay();
  const already = await prisma.attendance.findMany({
    where: { studentId: { in: studentIds }, session, date: { gte: start, lt: end } },
    select: { studentId: true },
  });
  const marked = new Set(already.map((a) => a.studentId));
  const fresh = studentIds.filter((id) => !marked.has(id));
  if (!fresh.length) return 0;

  const date = registerDate();
  const { count } = await prisma.attendance.createMany({
    data: fresh.map((studentId) => ({ studentId, status: "PRESENT", session, date, recordedBy })),
    // Belt and braces against a double-submit racing the check above; the
    // unique index is what actually guarantees it.
    skipDuplicates: true,
  });
  return count;
}


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
