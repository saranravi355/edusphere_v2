import { revalidatePath } from "next/cache";
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { FileText, CheckCircle2, Clock, Upload } from "lucide-react";

export default async function StudentHomeworkPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });

  const homeworks = student?.classroomId ? await prisma.homework.findMany({
    where: { classroomId: student.classroomId },
    include: {
      submissions: { where: { studentId: student.id } },
      subject: true,
    },
    orderBy: { dueDate: 'asc' }
  }) : [];

  const pending = homeworks.filter(h => h.submissions.length === 0);
  const submitted = homeworks.filter(h => h.submissions.length > 0);

  async function submitHomework(formData: FormData) {
    "use server";
    const homeworkId = formData.get("homeworkId") as string;
    const session = await getSession();
    if (!session) return;

    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return;

    await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
        submittedAt: new Date(),
        content: "Mock submission content",
        attachmentUrl: "mock-upload://submission.pdf"
      }
    });

    revalidatePath("/student/homework");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Homework & Assignments"
        description="Track and submit your pending coursework."
      />

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" /> Pending ({pending.length})
        </h3>
        <div className="space-y-3">
          {pending.map((hw) => (
            <div key={hw.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{hw.title}</p>
                  <p className="text-sm text-slate-500">{hw.subject.name} • Due {new Date(hw.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <form action={submitHomework}>
                <input type="hidden" name="homeworkId" value={hw.id} />
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Upload size={14} /> Submit
                </button>
              </form>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">No pending homework. Great job!</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" /> Submitted ({submitted.length})
        </h3>
        <div className="space-y-3">
          {submitted.map((hw) => (
            <div key={hw.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between opacity-75">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{hw.title}</p>
                  <p className="text-sm text-slate-500">{hw.subject.name} • Submitted</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Done</span>
            </div>
          ))}
          {submitted.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
