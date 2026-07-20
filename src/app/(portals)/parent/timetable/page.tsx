import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { buildWeeklyTimetable } from "@/lib/buildTimetable";
import { CalendarX2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentTimetablePage() {
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          classroom: true,
          ibSubjects: { orderBy: { subjectGroup: "asc" } },
        },
      },
    },
  });

  const student = parent?.students[0];

  const teachers = await prisma.teacher.findMany({
    include: { user: { select: { name: true } } },
  });
  const teacherNames = teachers
    .map((t) => t.user?.name)
    .filter((n): n is string => Boolean(n));

  const entries = buildWeeklyTimetable(
    (student?.ibSubjects ?? []).map((s) => ({
      subjectName: s.subjectName,
      level: s.level,
      subjectGroup: s.subjectGroup,
    })),
    teacherNames
  );

  const cls = student?.classroom?.name;
  const programme = student?.curriculum ? `${student.curriculum} programme` : "";

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Timetable"
          description={
            student
              ? `Weekly schedule for ${student.name}${cls ? ` · ${cls}` : ""}${programme ? ` · ${programme}` : ""}`
              : "Your child's weekly schedule"
          }
        />
      </div>

      {entries.length > 0 ? (
        <TimetableGrid entries={entries} isEditable={false} />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          <CalendarX2 className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="text-sm">
            No subjects assigned yet — the timetable will appear once the
            programme coordinator assigns IB subjects.
          </p>
        </div>
      )}
    </div>
  );
}
