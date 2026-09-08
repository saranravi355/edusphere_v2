import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import QueryTicketsClient from "./QueryTicketsClient";

export const dynamic = "force-dynamic";

/** Same "who teaches this student" reach used by Teacher Feedback and IB Core. */
export default async function StudentQueryTicketsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, classroomId: true },
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
  const classroom = student.classroomId
    ? await prisma.classroom.findUnique({
        where: { id: student.classroomId },
        select: { teacher: { select: { id: true, user: { select: { name: true } } } } },
      })
    : null;
  if (classroom?.teacher) {
    teacherMap.set(classroom.teacher.id, { id: classroom.teacher.id, name: classroom.teacher.user.name, subject: "Class Teacher" });
  }
  for (const t of timetableTeachers) {
    if (!t.teacher || teacherMap.has(t.teacher.id)) continue;
    teacherMap.set(t.teacher.id, { id: t.teacher.id, name: t.teacher.user.name, subject: bySubject.get(t.teacher.id) ?? null });
  }
  const teachers = Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const tickets = await prisma.queryTicket.findMany({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
    include: {
      teacher: { select: { user: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <PageHeader
        title="Ask a Teacher"
        description="Raise a ticket for a question or issue with a specific teacher. They'll see it and can reply here."
      />
      <QueryTicketsClient
        teachers={teachers}
        tickets={tickets.map((t) => ({
          id: t.id,
          teacherName: t.teacher.user.name,
          subject: t.subject,
          status: t.status,
          updatedAt: t.updatedAt.toISOString(),
          messages: t.messages.map((m) => ({ id: m.id, authorRole: m.authorRole, text: m.text, createdAt: m.createdAt.toISOString() })),
        }))}
      />
    </div>
  );
}
