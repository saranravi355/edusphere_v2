import prisma from "@/lib/prisma";

/**
 * The classrooms a teacher may see students in: the ones they are homeroom
 * teacher for, and the ones they appear on the timetable for.
 *
 * The same rule /teacher/growth applies to its student picker and the teacher's
 * student profile applies to its page. A page that shows one student's record
 * checks the student's classroom against this list and 404s when it is not in
 * it, so a pasted id does not confirm that a child exists.
 */
export async function classroomIdsForTeacher(userId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      classes: { select: { id: true } },
      timetable: { select: { classroomId: true } },
    },
  });
  if (!teacher) return [];
  return Array.from(new Set([
    ...teacher.classes.map((c) => c.id),
    ...teacher.timetable.map((t) => t.classroomId),
  ]));
}
