import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import IBCoreTeacherClient from "./IBCoreTeacherClient";
import { IB_CORE_ELEMENTS } from "@/lib/ib";

export const dynamic = "force-dynamic";

/**
 * A teacher supervises the DP students they actually teach — their own
 * classroom (class teacher) plus anyone on their timetable (subject teacher) —
 * same reach used for Teacher Feedback eligibility, so a student's set of
 * "my teachers" and a teacher's set of "my students" agree with each other.
 */
export default async function TeacherIBCorePage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      classes: { select: { id: true } },
      timetable: { select: { classroomId: true } },
    },
  });
  if (!teacher) redirect("/teacher");

  const classroomIds = Array.from(new Set([...teacher.classes.map((c) => c.id), ...teacher.timetable.map((t) => t.classroomId)]));

  const students = classroomIds.length
    ? await prisma.student.findMany({
        where: { classroomId: { in: classroomIds }, curriculum: "DP" },
        select: {
          id: true,
          name: true,
          registrationNo: true,
          classroom: { select: { name: true } },
          ibCore: {
            where: { element: { in: [...IB_CORE_ELEMENTS] } },
            include: { entries: { orderBy: { createdAt: "asc" } } },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    registrationNo: s.registrationNo,
    classroom: s.classroom?.name ?? null,
    byElement: Object.fromEntries(
      IB_CORE_ELEMENTS.map((el) => {
        const r = s.ibCore.find((rec) => rec.element === el);
        return [
          el,
          r
            ? {
                id: r.id,
                title: r.title,
                status: r.status,
                grade: r.grade,
                creativityHours: r.creativityHours,
                activityHours: r.activityHours,
                serviceHours: r.serviceHours,
                entries: r.entries.map((e) => ({
                  id: e.id,
                  authorRole: e.authorRole,
                  kind: e.kind,
                  strand: e.strand,
                  hours: e.hours,
                  text: e.text,
                  approved: e.approved,
                  createdAt: e.createdAt.toISOString(),
                })),
              }
            : null,
        ];
      })
    ),
  }));

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="IB Core Supervision"
        description="CAS, Extended Essay and TOK for the DP students you teach — review entries, comment, and approve CAS activities."
      />
      <IBCoreTeacherClient students={rows} />
    </div>
  );
}
