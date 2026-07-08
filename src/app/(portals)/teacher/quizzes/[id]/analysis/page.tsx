import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function mean(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((sum, n) => sum + Math.pow(n - m, 2), 0) / nums.length;
  return Math.sqrt(variance);
}

export default async function ExamAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER', 'SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      classroom: true,
      questions: true,
      attempts: {
        where: { status: { in: ["GRADED", "RELEASED"] } },
        include: { responses: true },
      },
    },
  });

  if (!quiz) notFound();

  const totalScores = quiz.attempts.map((a) => a.score);
  const classAverage = mean(totalScores);
  const sd = stdDev(totalScores);

  // Sort attempts by score to split top/bottom half for discrimination index
  const sorted = [...quiz.attempts].sort((a, b) => b.score - a.score);
  const halfSize = Math.max(1, Math.floor(sorted.length / 2));
  const topHalfIds = new Set(sorted.slice(0, halfSize).map((a) => a.id));
  const bottomHalfIds = new Set(sorted.slice(sorted.length - halfSize).map((a) => a.id));

  const questionStats = quiz.questions.map((q) => {
    const allResponses = quiz.attempts.flatMap((a) => a.responses.filter((r) => r.questionId === q.id).map((r) => ({ ...r, attemptId: a.id })));
    const scores = allResponses.map((r) => r.marksAwarded ?? 0);
    const avgScore = mean(scores);
    const maxScore = q.points || 1;
    const difficultyIndex = maxScore > 0 ? Math.round((avgScore / maxScore) * 100) : 0;

    const topCorrect = allResponses.filter((r) => topHalfIds.has(r.attemptId) && (r.marksAwarded ?? 0) >= maxScore * 0.5).length;
    const bottomCorrect = allResponses.filter((r) => bottomHalfIds.has(r.attemptId) && (r.marksAwarded ?? 0) >= maxScore * 0.5).length;
    const discriminationIndex = halfSize > 0 ? Math.round(((topCorrect - bottomCorrect) / halfSize) * 100) / 100 : 0;

    return { question: q, avgScore, difficultyIndex, discriminationIndex, responseCount: allResponses.length };
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href={`/teacher/quizzes/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} /> Back to Exam
      </Link>

      <PageHeader
        title={`Analysis: ${quiz.title}`}
        description={`${quiz.classroom.name} - based on ${quiz.attempts.length} graded submission${quiz.attempts.length === 1 ? "" : "s"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Class Average</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white">{classAverage.toFixed(1)} / {quiz.totalMarks}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Standard Deviation</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white">{sd.toFixed(2)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Graded Submissions</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white">{quiz.attempts.length}</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Question-Level Performance</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Question</th>
                <th className="p-4 font-medium">Avg Score</th>
                <th className="p-4 font-medium">Difficulty Index</th>
                <th className="p-4 font-medium">Discrimination Index</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {questionStats.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">No graded data yet.</td></tr>
              ) : (
                questionStats.map((qs, i) => (
                  <tr key={qs.question.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 text-slate-800 dark:text-slate-200 max-w-sm truncate">{i + 1}. {qs.question.text}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{qs.avgScore.toFixed(1)} / {qs.question.points}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${qs.difficultyIndex >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : qs.difficultyIndex >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {qs.difficultyIndex}%
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{qs.discriminationIndex.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
