import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TeacherFeedbackClient from "./TeacherFeedbackClient";

export const dynamic = "force-dynamic";

/**
 * Who can a student rate?
 *
 * There is no subject-teacher roster table — timetable is the only record of
 * who actually teaches this student's class. So "my teachers" is the distinct
 * set of teachers on the student's classroom timetable, plus the classroom's
 * homeroom teacher (who may run a period that predates the timetable, or none
 * at all).
 */
export default async function StudentTeacherFeedbackPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      classroomId: true,
      classroom: {
        select: {
          name: true,
          teacherId: true,
          teacher: { select: { id: true, user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!student) redirect("/student");

  const timetableTeachers = student.classroomId
    ? await prisma.timetableEntry.findMany({
        where: { classroomId: student.classroomId, teacherId: { not: null } },
        distinct: ["teacherId"],
        select: {
          subject: { select: { name: true } },
          teacher: { select: { id: true, user: { select: { name: true } } } },
        },
      })
    : [];

  const bySubject = new Map<string, string>();
  for (const t of timetableTeachers) {
    if (t.teacher) bySubject.set(t.teacher.id, t.subject.name);
  }

  const teacherMap = new Map<string, { id: string; name: string; subject: string | null }>();
  if (student.classroom?.teacher) {
    teacherMap.set(student.classroom.teacher.id, {
      id: student.classroom.teacher.id,
      name: student.classroom.teacher.user.name,
      subject: "Class Teacher",
    });
  }
  for (const t of timetableTeachers) {
    if (!t.teacher) continue;
    if (teacherMap.has(t.teacher.id)) continue;
    teacherMap.set(t.teacher.id, {
      id: t.teacher.id,
      name: t.teacher.user.name,
      subject: bySubject.get(t.teacher.id) ?? null,
    });
  }
  const teachers = Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const existing = await prisma.teacherFeedback.findMany({
    where: { studentId: student.id },
    select: {
      teacherId: true,
      classConductRating: true,
      explanationRating: true,
      communicationRating: true,
      supportRating: true,
      comment: true,
      updatedAt: true,
    },
  });
  const feedbackByTeacher = Object.fromEntries(
    existing.map((f) => [
      f.teacherId,
      {
        classConductRating: f.classConductRating,
        explanationRating: f.explanationRating,
        communicationRating: f.communicationRating,
        supportRating: f.supportRating,
        comment: f.comment,
        updatedAt: f.updatedAt.toISOString(),
      },
    ])
  );

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Teacher Feedback"
        description="Rate how your teachers run class, explain concepts, communicate and support you. Feedback goes straight to that teacher — your name is never shown to them."
      />
      <TeacherFeedbackClient teachers={teachers} feedbackByTeacher={feedbackByTeacher} />
    </div>
  );
}
