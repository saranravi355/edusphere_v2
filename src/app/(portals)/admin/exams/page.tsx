import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Unlock, ClipboardCheck } from "lucide-react";

async function releaseGrades(quizId: string) {
  "use server";
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) return;

  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: "GRADES_RELEASED", gradesReleasedAt: new Date() },
  });
  await prisma.quizAttempt.updateMany({
    where: { quizId, status: "GRADED" },
    data: { status: "RELEASED" },
  });

  revalidatePath("/admin/exams");
}

export default async function AdminExamsPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const moderated = await prisma.quiz.findMany({
    where: { status: "MODERATED" },
    include: {
      classroom: true,
      subject: true,
      teacher: { include: { user: true } },
      moderatedByTeacher: { include: { user: true } },
      attempts: true,
    },
    orderBy: { moderatedAt: "desc" },
  });

  const released = await prisma.quiz.findMany({
    where: { status: "GRADES_RELEASED" },
    include: { classroom: true, teacher: { include: { user: true } }, attempts: true },
    orderBy: { gradesReleasedAt: "desc" },
    take: 15,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Exam Grade Release"
        description="Grades become visible to students and parents only after being approved here."
      />

      <div className="glass-card">
        <div className="p-6 border-b border-ui-border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100">Ready for Release ({moderated.length})</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Exam</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Teacher</th>
                <th className="p-4 font-medium">Moderated By</th>
                <th className="p-4 font-medium">Submissions</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {moderated.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">No moderated exams awaiting release.</td></tr>
              ) : (
                moderated.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{q.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.classroom.name}{q.subject ? ` - ${q.subject.name}` : ""}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.teacher.user.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.moderatedByTeacher?.user.name || "-"}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.attempts.length}</td>
                    <td className="p-4">
                      <form action={releaseGrades.bind(null, q.id)}>
                        <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1 shadow-sm">
                          <Unlock size={12} /> Release Grades
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
          <h2 className="text-lg font-bold text-navy-900 dark:text-slate-100 flex items-center gap-2"><ClipboardCheck size={18} className="text-green-600" /> Recently Released</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-ui-border dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                <th className="p-4 font-medium">Exam</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Teacher</th>
                <th className="p-4 font-medium">Released On</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {released.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">Nothing released yet.</td></tr>
              ) : (
                released.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{q.title}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.classroom.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.teacher.user.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{q.gradesReleasedAt?.toLocaleDateString()}</td>
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
