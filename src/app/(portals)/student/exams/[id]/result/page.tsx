import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2, XCircle } from "lucide-react";

export default async function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
  if (!student) redirect("/");

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { subject: true },
  });
  if (!quiz) notFound();

  const attempt = await prisma.quizAttempt.findFirst({
    where: { quizId: id, studentId: student.id },
    include: { responses: { include: { question: true } } },
  });

  if (!attempt) redirect(`/student/exams/${id}/take`);

  const released = attempt.status === "RELEASED";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/student/exams" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} /> Back to Exams
      </Link>

      <PageHeader title={quiz.title} description={`${quiz.subject?.name ? `${quiz.subject.name} - ` : ""}${quiz.examType.replace("_", " ")}`} />

      {!released ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <Lock size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Grades Not Yet Released</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-1 text-sm">
            Your submission has been received. Your grade will appear here once your teacher finishes grading and school leadership approves the release.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Your Score</p>
            <p className="text-4xl font-bold text-navy-900 dark:text-white mt-1">{attempt.score} <span className="text-lg text-slate-400">/ {attempt.totalScore}</span></p>
          </div>

          <div className="space-y-4">
            {attempt.responses.map((r, i) => (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{i + 1}. {r.question.text}</p>
                {r.question.type === "MCQ" ? (
                  <div className="flex items-center gap-2 text-sm">
                    {r.selectedIdx === r.question.correctIdx ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><CheckCircle2 size={14} /> Correct</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium"><XCircle size={14} /> Incorrect</span>
                    )}
                    <span className="text-slate-400">- {r.marksAwarded ?? 0} / {r.question.points} pts</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap">{r.textAnswer}</p>
                    <p className="text-slate-500">Score: {r.marksAwarded ?? 0} / {r.question.points} pts</p>
                    {r.feedback && (
                      <p className="text-blue-600 dark:text-blue-400 italic">Feedback: {r.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
