import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Lightbulb } from "lucide-react";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import { SubmitButton } from "@/components/ui/form";
import { guard, TEACHER_ROLES } from "@/lib/authz";
import { formatDate, schoolDay } from "@/lib/dates";
import { markOne, markManyPresent } from "@/lib/attendance";

/** The caller's teacher row plus the ids of the classes they own. */
async function ownClasses() {
  const auth = await guard(TEACHER_ROLES);
  if (!auth.ok) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, subjects: true, classes: { select: { id: true } } },
  });
  if (!teacher) return null;
  return { userId: auth.user.id, teacher, classIds: teacher.classes.map((c) => c.id) };
}

async function markAttendance(studentId: string, status: string) {
  "use server";
  // `recordedBy` used to arrive from the client, so a caller could mark any
  // student and attribute it to any teacher. It is derived from the session
  // now, and the student must be in one of the caller's own classes.
  const ctx = await ownClasses();
  if (!ctx) return;
  if (!["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(status)) return;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classroomId: true } });
  if (!student || !ctx.classIds.includes(student.classroomId ?? "")) return;

  // Marking the register twice used to append a second row for the same child
  // on the same day, so the attendance percentage drifted every time a teacher
  // corrected a mistake. Today's record is updated in place.
  await markOne({ studentId, status, session: "FULL_DAY", recordedBy: ctx.userId });
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
}

async function assignGrade(studentId: string, formData: FormData) {
  "use server";
  // This action used to read `score` off the form and then call revalidatePath
  // and nothing else. The button showed "Saving…", the row re-rendered, and the
  // mark was gone — there was never a write.
  const ctx = await ownClasses();
  if (!ctx) return;

  const grade = Number(formData.get("score"));
  if (!Number.isInteger(grade) || grade < 1 || grade > 7) return;

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classroomId: true } });
  if (!student || !ctx.classIds.includes(student.classroomId ?? "")) return;

  const subjectName = ctx.teacher.subjects.split(",")[0]?.trim() || "General";
  await prisma.assessmentResult.create({
    data: {
      studentId,
      subjectName,
      title: `Class check — ${formatDate(new Date(), "dMonYyyy")}`,
      type: "FORMATIVE",
      date: new Date(),
      grade,
      maxGrade: 7,
    },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/reports");
}

async function bulkMarkPresent(studentIds: string[]) {
  "use server";
  const ctx = await ownClasses();
  if (!ctx) return;

  // Restrict to students the caller actually teaches, rather than trusting the list.
  const mine = await prisma.student.findMany({
    where: { id: { in: studentIds }, classroomId: { in: ctx.classIds } },
    select: { id: true },
  });
  if (!mine.length) return;

  const { start, end } = schoolDay();
  await markManyPresent({ studentIds: mine.map((s) => s.id), session: "FULL_DAY", recordedBy: ctx.userId });
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
}

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== "CLASS_TEACHER" && session.user.role !== "SUBJECT_TEACHER")) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: {
      subjects: true,
      classes: {
        select: { id: true, name: true, students: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
      },
    },
  });

  const myClass = teacher?.classes[0];
  const students = myClass?.students ?? [];

  // What is already recorded for today, so the buttons reflect the register
  // rather than always offering a blank "Present".
  const { start, end } = schoolDay();
  const todays = students.length
    ? await prisma.attendance.findMany({
        where: { studentId: { in: students.map((s) => s.id) }, date: { gte: start, lt: end }, session: "FULL_DAY" },
        select: { studentId: true, status: true },
      })
    : [];
  const statusOf = new Map(todays.map((a) => [a.studentId, a.status]));

  const unmarked = students.filter((s) => !statusOf.has(s.id)).map((s) => s.id);

  const OPTIONS = [
    { status: "PRESENT", label: "Present", Icon: CheckCircle2, on: "bg-green-600 text-white", off: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" },
    { status: "LATE", label: "Late", Icon: Clock, on: "bg-amber-500 text-white", off: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
    { status: "ABSENT", label: "Absent", Icon: XCircle, on: "bg-rose-600 text-white", off: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400" },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(" ")[0] || "Teacher"}`}
        description="Manage your class roster, grading, and attendance."
      />

      <SchoolSnapshot />

      <AIFeatureLink
        href="/teacher/ai-coach"
        icon={<Lightbulb size={15} />}
        title="AI Coaching Nudges"
        description="Weekly teaching insights from your gradebook, ATL and CAS records."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              {myClass ? `Today's register — ${myClass.name}` : "Today's register"}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatDate(new Date(), "weekdayDMon")} · {statusOf.size} of {students.length} marked
            </p>
          </div>
          {unmarked.length > 0 && (
            <form action={async () => { "use server"; await bulkMarkPresent(unmarked); }}>
              <SubmitButton size="sm" variant="subtle" pendingText="Marking…">
                Mark remaining {unmarked.length} present
              </SubmitButton>
            </form>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Quick grade (IB 1–7)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => {
                  const current = statusOf.get(student.id);
                  return (
                    <tr key={student.id}>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{student.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5" role="group" aria-label={`Attendance for ${student.name}`}>
                          {OPTIONS.map(({ status, label, Icon, on, off }) => (
                            <form key={status} action={async () => { "use server"; await markAttendance(student.id, status); }}>
                              <SubmitButton
                                size="sm"
                                variant="subtle"
                                pendingText="…"
                                aria-pressed={current === status}
                                className={`font-bold ${current === status ? on : off}`}
                              >
                                <Icon size={12} aria-hidden /> {label}
                              </SubmitButton>
                            </form>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <form action={async (fd) => { "use server"; await assignGrade(student.id, fd); }} className="flex items-center justify-center gap-2">
                          <label className="sr-only" htmlFor={`score-${student.id}`}>Score for {student.name}</label>
                          <input id={`score-${student.id}`} name="score" type="number" min={1} max={7} step={1} required
                            placeholder="1-7" title="IB grade, 1 to 7"
                            className="w-16 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs dark:bg-slate-800" />
                          <SubmitButton size="sm" variant="subtle" pendingText="Saving…" className="text-blue-600 font-bold bg-transparent hover:bg-blue-50 dark:hover:bg-slate-800">Save</SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400">No students assigned to your class.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            A quick grade is saved as a formative result against{" "}
            {teacher?.subjects.split(",")[0]?.trim() || "your subject"} and shows up in Reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
