import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Plus, Send, ArrowLeft, FileText, BarChart3 } from "lucide-react";

async function addQuestion(quizId: string, formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) return;

  const text = formData.get("text") as string;
  const type = formData.get("type") as string;
  const points = parseInt((formData.get("points") as string) || "1");
  const difficulty = (formData.get("difficulty") as string) || null;
  const bloomsLevel = (formData.get("bloomsLevel") as string) || null;

  let options: string | null = null;
  let correctIdx: number | null = null;
  let rubricCriteria: string | null = null;

  if (type === "MCQ") {
    const opts = [
      formData.get("optA") as string,
      formData.get("optB") as string,
      formData.get("optC") as string,
      formData.get("optD") as string,
    ].filter(Boolean);
    options = JSON.stringify(opts);
    correctIdx = parseInt((formData.get("correctIdx") as string) || "0");
  } else {
    const rubricRaw = (formData.get("rubric") as string) || "";
    const criteria = rubricRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [criterion, maxPoints] = line.split(":");
        return { criterion: (criterion || "").trim(), maxPoints: parseInt((maxPoints || "1").trim()) || 1 };
      });
    rubricCriteria = JSON.stringify(criteria);
  }

  await prisma.question.create({
    data: { quizId, text, type, options, correctIdx, points, difficulty, bloomsLevel, rubricCriteria },
  });
  await prisma.quiz.update({
    where: { id: quizId },
    data: { totalMarks: { increment: points } },
  });

  revalidatePath(`/teacher/quizzes/${quizId}`);
}

async function publishExam(quizId: string) {
  "use server";
  await prisma.quiz.update({ where: { id: quizId }, data: { status: "PUBLISHED" } });
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

async function submitForModeration(quizId: string) {
  "use server";
  await prisma.quiz.update({ where: { id: quizId }, data: { status: "PENDING_MODERATION" } });
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  PUBLISHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING_MODERATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MODERATED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  GRADES_RELEASED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      classroom: { include: { students: true } },
      subject: true,
      questions: true,
      attempts: { include: { student: true }, orderBy: { submittedAt: "desc" } },
    },
  });

  if (!quiz) notFound();

  const addQuestionAction = addQuestion.bind(null, quiz.id);
  const publishAction = publishExam.bind(null, quiz.id);
  const moderationAction = submitForModeration.bind(null, quiz.id);

  const gradedCount = quiz.attempts.filter((a) => a.status === "GRADED" || a.status === "RELEASED").length;
  const needsGrading = quiz.attempts.filter((a) => a.status === "SUBMITTED" || a.status === "IN_PROGRESS").length;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/teacher/quizzes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} /> Back to Exams
      </Link>

      <PageHeader
        title={quiz.title}
        description={`${quiz.classroom.name}${quiz.subject ? ` - ${quiz.subject.name}` : ""} - ${quiz.examType.replace("_", " ")} - Total marks: ${quiz.totalMarks}`}
        action={
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${STATUS_STYLES[quiz.status]}`}>
              {quiz.status.replace("_", " ")}
            </span>
            {quiz.status === "DRAFT" && quiz.questions.length > 0 && (
              <form action={publishAction}>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                  <Send size={14} /> Publish
                </button>
              </form>
            )}
            {quiz.status === "PUBLISHED" && needsGrading === 0 && quiz.attempts.length > 0 && (
              <form action={moderationAction}>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm">
                  Submit for Moderation
                </button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Class Size</p>
          <p className="text-xl font-bold text-navy-900 dark:text-white">{quiz.classroom.students.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Submissions</p>
          <p className="text-xl font-bold text-navy-900 dark:text-white">{quiz.attempts.length} / {quiz.classroom.students.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Graded</p>
          <p className="text-xl font-bold text-navy-900 dark:text-white">{gradedCount} / {quiz.attempts.length}</p>
        </div>
      </div>

      {quiz.status === "DRAFT" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Add Question</h2>
          <form action={addQuestionAction} className="space-y-4">
            <textarea required name="text" rows={2} placeholder="Question text..." className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select name="type" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                <option value="MCQ">Multiple Choice</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="ESSAY">Essay / Long Form</option>
              </select>
              <input name="points" type="number" defaultValue={5} placeholder="Points" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
              <select name="difficulty" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <select name="bloomsLevel" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                <option value="Remember">Remember</option>
                <option value="Understand">Understand</option>
                <option value="Apply">Apply</option>
                <option value="Analyze">Analyze</option>
                <option value="Evaluate">Evaluate</option>
                <option value="Create">Create</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">For Multiple Choice: options + correct answer index (0-3)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input name="optA" placeholder="Option A" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
                  <input name="optB" placeholder="Option B" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
                  <input name="optC" placeholder="Option C" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
                  <input name="optD" placeholder="Option D" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <select name="correctIdx" className="w-full mt-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                  <option value="0">Correct: A</option>
                  <option value="1">Correct: B</option>
                  <option value="2">Correct: C</option>
                  <option value="3">Correct: D</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">For Essay/Short Answer: rubric criteria, one per line as &quot;Criterion:MaxPoints&quot;</p>
                <textarea name="rubric" rows={5} placeholder={"Thesis clarity:5\nUse of evidence:5\nOrganization:5"} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Add Question
            </button>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Questions ({quiz.questions.length})</h2>
          {quiz.questions.length > 0 && (
            <Link href={`/teacher/quizzes/${quiz.id}/analysis`} className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
              <BarChart3 size={14} /> Analysis Report
            </Link>
          )}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {quiz.questions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No questions added yet.</p>
          ) : (
            quiz.questions.map((q, i) => (
              <div key={q.id} className="p-4 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{i + 1}. {q.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{q.type.replace("_", " ")} - {q.points} pts{q.difficulty ? ` - ${q.difficulty}` : ""}{q.bloomsLevel ? ` - ${q.bloomsLevel}` : ""}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Submissions</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Submitted</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {quiz.attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">No submissions yet.</td>
                </tr>
              ) : (
                quiz.attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{a.student.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.autoSubmitted ? "Auto-submitted" : "Submitted"} {a.submittedAt.toLocaleDateString('en-GB')}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{a.score} / {a.totalScore}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === "GRADED" || a.status === "RELEASED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/teacher/quizzes/${quiz.id}/grade/${a.id}`} className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
                        <FileText size={14} /> Grade
                      </Link>
                    </td>
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
