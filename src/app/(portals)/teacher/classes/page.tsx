import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Users, HeartHandshake, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });

  // Classes I own as homeroom teacher, else classes I appear on the timetable for
  let classrooms = teacher
    ? await prisma.classroom.findMany({
        where: { teacherId: teacher.id },
        include: { students: { select: { id: true, learningNeeds: true } }, timetable: { where: { teacherId: teacher.id } } },
      })
    : [];
  if (classrooms.length === 0 && teacher) {
    const slotClassIds = await prisma.timetableEntry.findMany({
      where: { teacherId: teacher.id },
      select: { classroomId: true },
      distinct: ["classroomId"],
    });
    classrooms = await prisma.classroom.findMany({
      where: { id: { in: slotClassIds.map((s) => s.classroomId) } },
      include: { students: { select: { id: true, learningNeeds: true } }, timetable: { where: { teacherId: teacher.id } } },
    });
  }
  if (classrooms.length === 0) {
    classrooms = await prisma.classroom.findMany({
      take: 3,
      include: { students: { select: { id: true, learningNeeds: true } }, timetable: true },
    });
  }

  const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="My Classes"
        description="The classes you teach — live student counts, learning-support flags and your scheduled periods."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((c) => {
          const sen = c.students.filter((s) => s.learningNeeds).length;
          const days = [...new Set(c.timetable.map((t) => DAYS[t.dayOfWeek]))].filter(Boolean);
          return (
            <div key={c.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  <Users size={18} />
                </span>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Users size={14} /> {c.students.length} students enrolled
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <HeartHandshake size={14} /> {sen} with learning-support flags
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock size={14} /> {c.timetable.length} periods{days.length ? ` · ${days.join(", ")}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/teacher/attendance" className="flex-1 py-2 text-center text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 rounded-lg transition-colors">
                  Attendance
                </Link>
                <Link href={`/teacher/students?classId=${c.name}`} className="flex-1 py-2 text-center text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors">
                  Students
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
