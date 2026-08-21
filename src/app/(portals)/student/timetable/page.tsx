import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { timetableForClassroom } from "@/lib/timetable";
import { CalendarX2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentTimetablePage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      classroom: true,
      ibSubjects: { orderBy: { subjectGroup: "asc" } },
    },
  });

  // The schedule the school has actually published for this class, rather than
  // one synthesised from the student's subject list with invented periods,
  // rooms and teachers.
  const entries = await timetableForClassroom(student?.classroomId);

  const programme = student?.curriculum ? `${student.curriculum} programme` : "";
  const cls = student?.classroom?.name;

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <PageHeader
        title="My Timetable"
        description={
          cls
            ? `Weekly schedule · ${cls}${programme ? ` · ${programme}` : ""}`
            : "Your weekly schedule"
        }
      />

      {entries.length > 0 ? (
        <TimetableGrid
          entries={entries}
          isEditable={false}
          subjectLinkBase="/student/subjects"
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          <CalendarX2 className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="text-sm">
            No subjects enrolled yet — your timetable will appear once your
            programme coordinator assigns your IB subjects.
          </p>
        </div>
      )}
    </div>
  );
}
