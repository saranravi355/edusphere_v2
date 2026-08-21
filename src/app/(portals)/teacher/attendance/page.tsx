import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/form";
import { setAttendance, markSessionPresent } from "./actions";
import { formatDate, schoolDay } from "@/lib/dates";
import { SESSIONS } from "@/lib/attendance";


export const dynamic = "force-dynamic";

const MARKS = [
  { status: "PRESENT", Icon: CheckCircle2, label: "Present", on: "bg-green-600 text-white", off: "bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-600 dark:bg-slate-800" },
  { status: "LATE", Icon: Clock, label: "Late", on: "bg-amber-500 text-white", off: "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800" },
  { status: "ABSENT", Icon: XCircle, label: "Absent", on: "bg-rose-600 text-white", off: "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800" },
  { status: "EXCUSED", Icon: ShieldCheck, label: "Excused", on: "bg-slate-600 text-white", off: "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800" },
] as const;

/**
 * Daily Attendance.
 *
 * Nothing on this page could write. The four marking buttons per student were
 * bare `<button>`s in a Server Component with no handler and no form; the
 * "Save Attendance" and "Offline Sync" buttons in the header were the same;
 * and both the morning and afternoon columns coloured themselves from
 * `attendances[0]`, so the afternoon simply mirrored the morning regardless of
 * what was recorded. If the class had no students, three invented children were
 * rendered instead — one of them already showing as PRESENT.
 *
 * Marks save the moment they are pressed, per session, and pressing the same
 * mark again clears it.
 */
export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await getSession();
  if (!session || !["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(session.user.role)) redirect("/");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { classes: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Daily Attendance" />
        <p className="text-slate-500">You are not assigned to any classes.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const activeClass = teacher.classes.find((c) => c.id === sp.classId) ?? teacher.classes[0];

  const { start, end } = schoolDay();
  const students = await prisma.student.findMany({
    where: { classroomId: activeClass.id, isActive: true },
    select: {
      id: true,
      name: true,
      registrationNo: true,
      attendances: {
        where: { date: { gte: start, lt: end } },
        select: { session: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const markedFor = (sessionName: string) =>
    students.filter((s) => s.attendances.some((a) => a.session === sessionName)).length;

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader
        title="Daily Attendance"
        description={`${activeClass.name} · ${formatDate(new Date(), "weekdayDMon")}`}
        action={
          teacher.classes.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/teacher/attendance?classId=${c.id}`}
                  aria-current={c.id === activeClass.id ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    c.id === activeClass.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SESSIONS.map((s) => {
          const done = markedFor(s);
          return (
            <div key={s} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
                <p className="text-xs text-slate-500">{done} of {students.length} marked</p>
              </div>
              {done < students.length && (
                <form action={async () => { "use server"; await markSessionPresent(activeClass.id, s); }}>
                  <SubmitButton size="sm" variant="subtle" pendingText="Marking…">
                    Mark rest present
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Student</th>
              {SESSIONS.map((s) => (
                <th key={s} className="px-6 py-4 text-center">{s.charAt(0) + s.slice(1).toLowerCase()} session</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{student.name}</div>
                  <div className="text-xs text-slate-500">{student.registrationNo}</div>
                </td>
                {SESSIONS.map((sessionName) => {
                  const current = student.attendances.find((a) => a.session === sessionName)?.status;
                  return (
                    <td key={sessionName} className="px-6 py-4">
                      <div className="flex justify-center gap-1.5" role="group" aria-label={`${sessionName.toLowerCase()} attendance for ${student.name}`}>
                        {MARKS.map(({ status, Icon, label, on, off }) => (
                          <form key={status} action={async () => { "use server"; await setAttendance(student.id, sessionName, status); }}>
                            <button
                              type="submit"
                              title={current === status ? `${label} — press again to clear` : label}
                              aria-label={`${label} ${current === status ? "(selected)" : ""}`}
                              aria-pressed={current === status}
                              className={`p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-600 ${current === status ? on : off}`}
                            >
                              <Icon size={18} aria-hidden />
                            </button>
                          </form>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  No active students in {activeClass.name}.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Marks save as you press them — there is no separate save step. Pressing the same mark again clears it.
      </p>
    </div>
  );
}
