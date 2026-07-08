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
              <select name="su