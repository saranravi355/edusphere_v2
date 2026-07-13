import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, Lock, PlayCircle, CalendarClock, Landmark } from "lucide-react";

export default async function StudentExamsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });

  // IB examination schedule (Papers, IAs, eAssessments) for this student's programme & subjects
  const mySubjectNames = student
    ? (await prisma.iBSubjectRecord.findMany({ where: { studentId: student.id }, select: { subjectName: true } })).map((r) => r.subjectName)
    : [];
  const ibSessions = student
    ? await prisma.iBExamSession.findMany({
        where: {
          programme: student.curriculum,
          // DP students see only their own subjects; MYP sessions (eAssessments, Personal Project) apply to the whole cohort
          ...(student.curriculum === "DP" && mySubjectNames.length > 0 ? { subjectName: { in: mySubjectNames } } : {}),
        },
        orderBy: { date: "asc" },
      })
    : [];
  const sessionGroups = ibSessions.reduce<Record<string, typeof ibSessions>>((acc, e) => {
    (acc[e.session] = acc[e.session] || []).push(e);
    return acc;
  }, {});

  const exams = student?.classroomId ? await prisma.quiz.findMany({
    where: {
      classroomId: student.classroomId,
      status: { in: ["PUBLISHED", "PENDING_MODERATION", "MODERATED", "GRADES_RELEASED"] },
    },
    include: {
      subject: true,
      questions: true,
      attempts: { where: { studentId: student.id } },
    },
    orderBy: { dueDate: "asc" },
  }) : [];

  const available = exams.filter((e) => e.attempts.length === 0);
  const attempted = exams.filter((e) => e.attempts.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Exams & Assessments"
        description="Your IB examination schedule, internal assessment deadlines, and school-based quizzes."
      />

      {/* IB Examination Schedule */}
      {Object.keys(sessionGroups).length > 0 && (
        <div className="space-y-6">
          {Object.entries(sessionGroups).map(([name, entries]) => (
            <div key={name} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-2">
                <Landmark size={16} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">IB {entries[0].programme}</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                {entries.map((e) => (
                  <div key={e.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <CalendarClock size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                          {e.subjectName}{e.level ? ` ${e.level}` : ""} — {e.paper}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(e.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                          {" · "}
                          {new Date(e.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {e.durationMinutes > 0 ? ` · ${e.durationMinutes} min` : ""}
                          {e.room ? ` · ${e.room}` : ""}
                        </p>
                      </div>
                    </div>
                    {e.notes && (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                        {e.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" /> School Assessments — Available to Take ({available.length})
        </h3>
        <div className="space-y-3">
          {available.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">Nothing new to take right now.</p>
          )}
          {available.map((exam) => (
            <div key={exam.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.title}</p>
                  <p className="text-sm text-slate-500">
                    {exam.subject?.name ? `${exam.subject.name} - ` : ""}{exam.examType.replace("_", " ")} - {exam.questions.length} questions
                    {exam.timeLimitMinutes ? ` - ${exam.timeLimitMinutes} min` : " - Untimed"}
                  </p>
                </div>
              </div>
              <Link href={`/student/exams/${exam.id}/take`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                <PlayCircle size={14} /> Start
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" /> Completed ({attempted.length})
        </h3>
        <div className="space-y-3">
          {attempted.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">No completed exams yet.</p>
          )}
          {attempted.map((exam) => {
            const attempt = exam.attempts[0];
            const released = attempt.status === "RELEASED";
            return (
              <div key={exam.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between opacity-90">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${released ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    {released ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.title}</p>
                    <p className="text-sm text-slate-500">{released ? `Score: ${attempt.score} / ${exam.totalMarks}` : "Awaiting grade release"}</p>
                  </div>
                </div>
                <Link href={`/student/exams/${exam.id}/result`} className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  View
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
