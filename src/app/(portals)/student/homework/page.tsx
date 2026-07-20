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
    const content = String(formData.get("content") || "").trim();
    const attachmentUrl = String(formData.get("attachmentUrl") || "").trim();
    const session = await getSession();
    if (!session || !homeworkId || !content) return;

    const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
    if (!student) return;

    await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
        submittedAt: new Date(),
        content,
        attachmentUrl: attachmentUrl || null,
      },
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
            <details key={hw.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <summary className="p-5 flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{hw.title}</p>
                    <p className="text-sm text-slate-500">{hw.subject.name} • Due {new Date(hw.dueDate).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Upload size={14} /> Submit
                </span>
              </summary>
              <form action={submitHomework} className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <input type="hidden" name="homeworkId" value={hw.id} />
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Your submission</label>
                  <textarea name="content" required rows={4} placeholder="Type your answer, or paste your working / reflection here..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    Attachment link <span className="text-slate-400">(optional — e.g. a Google Doc or Drive link)</span>
                  </label>
                  <input type="url" name="attachmentUrl" placeholder="https://..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Upload size={14} /> Submit homework
                </button>
              </form>
            </details>
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
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{hw.title}</p>
                  <p className="text-sm text-slate-500">
                    {hw.subject.name} • Submitted{hw.submissions[0]?.submittedAt ? ` ${new Date(hw.submissions[0].submittedAt).toLocaleDateString('en-GB')}` : ''}
                  </p>
                  {hw.submissions[0]?.content && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">&ldquo;{hw.submissions[0].content}&rdquo;</p>
                  )}
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
