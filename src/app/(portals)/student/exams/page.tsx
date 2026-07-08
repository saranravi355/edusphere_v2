import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, Lock, PlayCircle } from "lucide-react";

export default async function StudentExamsPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });

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
        title="Exams & Quizzes"
        description="Take timed assessments and review your results once grades are released."
      />

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" /> Available to Take ({available.length})
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
