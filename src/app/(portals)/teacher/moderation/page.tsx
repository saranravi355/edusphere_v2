import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ClipboardCheck, Eye } from "lucide-react";

async function approveModeration(quizId: string) {
  "use server";
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) return;

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return;

  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: "MODERATED", moderatedByTeacherId: teacher.id, moderatedAt: new Date() },
  });

  revalidatePath("/teacher/moderation");
}

export default async function ModerationQueuePage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return null;

  // Second-teacher review: only exams pending moderation that this teacher did NOT create
  const pending = await prisma.quiz.findMany({
    where: { status: "PENDING_MODERATION", teacherId: { not: teacher.id } },
    include: { classroom: true, subject: true, teacher: { include: { user: true } }, attempts: true },
    orderBy: { dueDate: "desc" },
  });

  const moderatedByMe = await prisma.quiz.findMany({
    where: { moderatedByTeacherId: teacher.id },
    include: { classroom: true, teacher: { include: { user: true } } },
    orderBy: { moderatedAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Moderation Queue"
        description="Second-teacher review of exams before grades are finalized. You cannot moderate your own exams."
      />

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Awaiting Your Review ({pending.length})</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Exam</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Created By</th>
                <th className="p-4 font-medium">Submissions</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pending.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">Nothing pending moderation right now.</td></tr>
              ) : (
                pending.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{q.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.classroom.name}{q.subject ? ` - ${q.subject.name}` : ""}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.teacher.user.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.attempts.length}</td>
                    <td className="p-4 flex items-center gap-3">
                      <Link href={`/teacher/quizzes/${q.id}/analysis`} className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline text-xs">
                        <Eye size={14} /> Review
                      </Link>
                      <form action={approveModeration.bind(null, q.id)}>
                        <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm">
                          <ClipboardCheck size={12} /> Approve
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Recently Moderated by You</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Exam</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Original Teacher</th>
                <th className="p-4 font-medium">Moderated On</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {moderatedByMe.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">No moderation history yet.</td></tr>
              ) : (
                moderatedByMe.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{q.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.classroom.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.teacher.user.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.moderatedAt?.toLocaleDateString('en-GB')}</td>
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
