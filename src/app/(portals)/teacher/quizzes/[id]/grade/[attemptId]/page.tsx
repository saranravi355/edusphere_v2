import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { revalidatePath, revalidatePath as revalidate } from "next/cache";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

async function saveGrades(attemptId: string, quizId: string, formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) return;

  const responses = await prisma.quizResponse.findMany({
    where: { attemptId },
    include: { question: true },
  });

  let totalAwarded = 0;

  for (const r of responses) {
    if (r.question.type === "MCQ") {
      const isCorrect = r.selectedIdx === r.question.correctIdx;
      const marks = isCorrect ? r.question.points : 0;
      totalAwarded += marks;
      await prisma.quizResponse.update({
        where: { id: r.id },
        data: { marksAwarded: marks },
      });
    } else {
      const criteria: { criterion: string; maxPoints: number }[] = r.question.rubricCriteria
        ? JSON.parse(r.question.rubricCriteria)
        : [];
      const rubricScores = criteria.map((c, i) => {
        const val = parseFloat((formData.get(`rubric_${r.id}_${i}`) as string) || "0");
        return { criterion: c.criterion, points: Math.min(val, c.maxPoints) };
      });
      const marks = rubricScores.reduce((s, c) => s + c.points, 0);
      const feedback = (formData.get(`feedback_${r.id}`) as string) || "";
      totalAwarded += marks;
      await prisma.quizResponse.update({
        where: { id: r.id },
        data: { marksAwarded: marks, rubricScores: JSON.stringify(rubricScores), feedback },
      });
    }
  }

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { score: Math.round(totalAwarded), status: "GRADED" },
  });

  revalidate(`/teacher/quizzes/${quizId}`);
  revalidatePath(`/teacher/quizzes/${quizId}/grade/${attemptId}`);
}

export default async function GradeAttemptPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = await params;
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      quiz: true,
      responses: { include: { question: true } },
    },
  });

  if (!attempt || attempt.quizId !== id) notFound();

  const saveAction = saveGrades.bind(null, attemptId, id);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href={`/teacher/quizzes/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} /> Back to Exam
      </Link>

      <PageHeader
        title={`Grading: ${attempt.student.name}`}
        description={`${attempt.quiz.title} - Score: ${attempt.score} / ${attempt.totalScore || attempt.quiz.totalMarks} - Status: ${attempt.status}`}
      />

      <form action={saveAction} className="space-y-6">
        {attempt.responses.map((r, i) => (
          <div key={r.id} className="glass-card p-6">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">{i + 1}. {r.question.text} <span className="text-xs text-slate-400">({r.question.points} pts)</span></p>

            {r.question.type === "MCQ" ? (
              <div className="text-sm space-y-2">
                <p className="text-slate-600 dark:text-slate-400">
                  Student answered: <span className="font-medium">{r.selectedIdx !== null && r.question.options ? JSON.parse(r.question.options)[r.selectedIdx] : "No answer"}</span>
                </p>
                {r.selectedIdx === r.question.correctIdx ? (
                  <p className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><CheckCircle2 size={14} /> Correct - auto-graded {r.question.points} pts</p>
                ) : (
                  <p className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium"><XCircle size={14} /> Incorrect - auto-graded 0 pts</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {r.textAnswer || <span className="text-slate-400 italic">No answer submitted</span>}
                </div>
                {(r.question.rubricCriteria ? JSON.parse(r.question.rubricCriteria) : []).map((c: { criterion: string; maxPoints: number }, ci: number) => (
                  <div key={ci} className="flex items-center gap-3">
                    <label className="text-sm text-slate-600 dark:text-slate-400 flex-1">{c.criterion} (max {c.maxPoints})</label>
                    <input
                      type="number"
                      name={`rubric_${r.id}_${ci}`}
                      min={0}
                      max={c.maxPoints}
                      defaultValue={0}
                      className="w-24 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Feedback for student</label>
                  <textarea name={`feedback_${r.id}`} rows={2} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" placeholder="Written feedback..." />
                </div>
              </div>
            )}
          </div>
        ))}

        <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          Save Grades
        </button>
      </form>
    </div>
  );
}
