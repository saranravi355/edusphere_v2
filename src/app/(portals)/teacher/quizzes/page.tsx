import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { HelpCircle, Plus, CheckCircle2, Clock, ClipboardCheck, ChevronRight } from "lucide-react";

async function createExam(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) return;

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return;

  const title = formData.get("title") as string;
  const classroomId = formData.get("classroomId") as string;
  const subjectId = formData.get("subjectId") as string;
  const examType = formData.get("examType") as string;
  const dueDate = formData.get("dueDate") as string;
  const timeLimitMinutes = formData.get("timeLimitMinutes") as string;

  await prisma.quiz.create({
    data: {
      title,
      teacherId: teacher.id,
      classroomId,
      subjectId: subjectId || null,
      examType,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
      status: "DRAFT",
    },
  });

  revalidatePath("/teacher/quizzes");
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  PUBLISHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING_MODERATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MODERATED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  GRADES_RELEASED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function QuizzesPage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: true,
      quizzes: {
        include: {
          classroom: true,
          subject: true,
          questions: true,
          attempts: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!teacher) return null;

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  const totalExams = teacher.quizzes.length;
  const publishedExams = teacher.quizzes.filter((q) => q.status !== "DRAFT").length;
  const totalSubmissions = teacher.quizzes.reduce((sum, q) => sum + q.attempts.length, 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Online Assessments"
        description="Create and manage exams, quizzes, and assessments for your classes."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <HelpCircle className="text-blue-600 dark:text-blue-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{totalExams}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Exams &amp; Quizzes</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CheckCircle2 className="text-green-600 dark:text-green-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{totalSubmissions}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Submissions Received</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
          <ClipboardCheck className="text-purple-600 dark:text-purple-400 mb-2" size={32} />
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">{publishedExams}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Published</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100 mb-4">Create New Exam</h2>
          <form action={createExam} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
              <input required name="title" type="text" placeholder="e.g. Cell Biology Midterm" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Class</label>
              <select required name="classroomId" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                {teacher.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject</label>
              <select name="subjectId" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                <option value="">General</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
              <select name="examType" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm">
                <option value="QUIZ">Quiz</option>
                <option value="UNIT_TEST">Unit Test</option>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final Exam</option>
                <option value="PRACTICAL">Practical</option>
                <option value="VIVA">Viva</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due</label>
                <input required name="dueDate" type="date" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
              </div>
            </div>
            <div className="lg:col-span-6 flex items-end gap-3">
              <div className="w-40">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Time Limit (mins)</label>
                <input name="timeLimitMinutes" type="number" placeholder="Untimed" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm" />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={16} /> Create Exam
              </button>
            </div>
          </form>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Questions</th>
                <th className="p-4 font-medium">Submissions</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {teacher.quizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No exams created yet. Use the form above to create your first one.
                  </td>
                </tr>
              ) : (
                teacher.quizzes.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{q.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.classroom.name}{q.subject ? ` - ${q.subject.name}` : ""}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.examType.replace("_", " ")}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.questions.length}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 flex items-center gap-1"><Clock size={12} />{q.attempts.length}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLES[q.status] || STATUS_STYLES.DRAFT}`}>
                        {q.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/teacher/quizzes/${q.id}`} className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline">
                        Manage <ChevronRight size={14} />
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
