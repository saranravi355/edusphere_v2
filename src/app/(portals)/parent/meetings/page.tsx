import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, CalendarX } from "lucide-react";
import BookingForm from "./BookingForm";
import { cancelMeeting } from "./actions";
import { ConfirmIconButton } from "@/components/ui/form";
import { utcToSlot } from "@/lib/meetings";
import { formatDate, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Parent-Teacher Meetings.
 *
 * Every control on this page was inert and every fact on it was invented — see
 * actions.ts. Bookings are real now, slots come from what is actually free, and
 * the teacher is notified when one is taken or given back.
 */
export default async function ParentMeetingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") redirect("/");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    select: { id: true, students: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });
  if (!parent) redirect("/parent");

  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 86_400_000);

  const [teachers, mine, booked] = await Promise.all([
    prisma.teacher.findMany({
      select: { id: true, subjects: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.parentTeacherMeeting.findMany({
      where: { parentId: parent.id, scheduledAt: { gte: now } },
      select: {
        id: true, scheduledAt: true, durationMinutes: true, topic: true,
        teacher: { select: { subjects: true, user: { select: { name: true } } } },
        student: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    // Everything already taken in the booking window, for any parent — this is
    // what makes a slot show as unavailable instead of one being struck through
    // as decoration.
    prisma.parentTeacherMeeting.findMany({
      where: { scheduledAt: { gte: now, lte: horizon } },
      select: { teacherId: true, scheduledAt: true },
    }),
  ]);

  const takenKeys = booked.map(
    (b) => `${b.teacherId}|${new Date(b.scheduledAt.getTime() + 330 * 60_000).toISOString().slice(0, 10)}|${utcToSlot(b.scheduledAt)}`,
  );

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader
        title="Parent-Teacher Meetings"
        description="Schedule and manage 1-on-1 consultations with teachers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-blue-500" aria-hidden /> Upcoming meetings
          </h3>

          {mine.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nothing booked yet. Choose a teacher and a time on the right — they are told straight away.
              </CardContent>
            </Card>
          )}

          {mine.map((m) => (
            <Card key={m.id} className="glass-card border-blue-200 dark:border-blue-900/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <User className="text-slate-400" aria-hidden />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">
                        {m.teacher.user.name}{m.teacher.subjects ? ` (${m.teacher.subjects.split(",")[0].trim()})` : ""}
                      </h4>
                      <p className="text-sm text-slate-500">About {m.student.name}</p>
                      {m.topic && <p className="text-sm text-slate-500 mt-1 italic">&ldquo;{m.topic}&rdquo;</p>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 min-w-[200px]">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Calendar size={14} className="text-blue-500" aria-hidden /> {formatDate(m.scheduledAt, "dMonYyyy")}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Clock size={14} className="text-orange-500" aria-hidden /> {formatTime(m.scheduledAt)} · {m.durationMinutes} min
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                  <ConfirmIconButton
                    onConfirm={async () => { "use server"; return cancelMeeting(m.id); }}
                    question="Cancel this meeting?"
                    confirmLabel="Cancel it"
                    triggerLabel={`Cancel the meeting with ${m.teacher.user.name}`}
                    triggerClassName="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CalendarX size={14} aria-hidden /> Cancel
                  </ConfirmIconButton>
                  <p className="text-xs text-slate-400">
                    Meetings are held in person at the school. Cancelling frees the slot for another family.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Book a slot</h3>
          <Card className="glass-card">
            <CardContent className="p-6">
              {teachers.length === 0 || parent.students.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {parent.students.length === 0
                    ? "No children are linked to your account yet."
                    : "No teachers are on staff yet."}
                </p>
              ) : (
                <BookingForm
                  teachers={teachers.map((t) => ({ id: t.id, name: t.user.name, subjects: t.subjects.split(",")[0].trim() }))}
                  students={parent.students}
                  takenByTeacherAndSlot={takenKeys}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
