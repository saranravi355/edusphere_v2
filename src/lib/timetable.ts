import prisma from "@/lib/prisma";
import type { TimetableEntryProps } from "@/components/timetable/TimetableGrid";

/**
 * The school's actual timetable, from the TimetableEntry table the admin
 * timetable manager and the auto-generator both write to.
 *
 * This replaces two different sources of invented schedules. The student and
 * parent pages called buildWeeklyTimetable(), which took the child's real IB
 * subjects and then made up which day, which period, which room and which
 * teacher — so a parent checking where their child was at 11am on Tuesday got a
 * plausible answer that matched nothing the school had planned. The teacher
 * planner rendered a hardcoded array from lib/mockTimetable.
 *
 * A class with no published timetable now shows an empty state, because that is
 * the true answer.
 */
function toProps(rows: {
  id: string;
  dayOfWeek: number;
  period: number;
  room: string | null;
  subject: { name: string };
  teacher: { user: { name: string } } | null;
  classroom?: { name: string } | null;
}[]): TimetableEntryProps[] {
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    period: r.period,
    subject: r.subject.name,
    teacher: r.teacher?.user.name ?? "",
    room: r.room ?? r.classroom?.name ?? "",
  }));
}

export async function timetableForClassroom(classroomId: string | null | undefined): Promise<TimetableEntryProps[]> {
  if (!classroomId) return [];
  const rows = await prisma.timetableEntry.findMany({
    where: { classroomId },
    select: {
      id: true, dayOfWeek: true, period: true, room: true,
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { name: true } } } },
      classroom: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });
  return toProps(rows);
}

/** A teacher's own week — every class they are timetabled to teach. */
export async function timetableForTeacher(teacherId: string | null | undefined): Promise<TimetableEntryProps[]> {
  if (!teacherId) return [];
  const rows = await prisma.timetableEntry.findMany({
    where: { teacherId },
    select: {
      id: true, dayOfWeek: true, period: true, room: true,
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { name: true } } } },
      classroom: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });
  // For a teacher the useful second line is the class, not their own name.
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    period: r.period,
    subject: r.subject.name,
    teacher: r.classroom?.name ?? "",
    room: r.room ?? "",
  }));
}
