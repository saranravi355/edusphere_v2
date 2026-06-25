import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, UploadCloud, Clock, CheckCircle2, FileText } from "lucide-react";



export default async function StudentHomeworkPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'STUDENT') {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      classroom: true,
      homeworkSubmits: true
    }
  });

  if (!student) return null;

  const pendingHomeworks = await prisma.homework.findMany({
    where: {
      classroomId: student.classroomId || undefined,
      submissions: {
        none: { studentId: student.id }
      }
    },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { dueDate: 'asc' }
  });

  const submittedHomeworks = await prisma.homeworkSubmission.findMany({
    where: { studentId: student.id },
    include: {
      homework: { include: { subject: true } }
    },
    orderBy: { submittedAt: 'desc' }
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader 
        title="My Homework" 
        description="View and submit your pending assignments."
      />

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" /> Pending Assignments
          </h2>
          {pendingHomeworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingHomeworks.map(hw => (
                <Card key={hw.id} className="glass-card hover:shadow-md transition-shadow border-orange-200 dark:border-orange-900/50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-semibold">
                        {hw.subject.name}
                      </span>
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                        Due {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{hw.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{hw.description}</p>

                    {hw.attachmentUrl && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Attached Worksheet</span>
                        <a href={hw.attachmentUrl} className="ml-auto text-xs font-bold text-blue-600 hover:underline">Download</a>
                      </div>
                    )}

                    <form className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800" action={async (formData) => {
                      "use server";
                      const content = formData.get("content") as string;
                      // Simulated upload: generating a fake attachment URL based on file presence
                      const hasFile = formData.get("file") as File;
                      const fakeUrl = hasFile && hasFile.size > 0 ? `/uploads/students/${student.id}/${hasFile.name}` : null;
                      
                      await prisma.homeworkSubmission.create({
                        data: {
                          homeworkId: hw.id,
                          studentId: student.id,
                          content,
                          attachmentUrl: fakeUrl
                        }
                      });
                      const { revalidatePath } = require("next/cache");
                      revalidatePath("/student/homework");
                    }}>
                      <div className="space-y-3">
                        <textarea 
                          name="content"
                          placeholder="Type your answer or add a comment..." 
                          className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                          required
                        />
                        
                        {/* Fake Upload UI */}
                        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <input type="file" name="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">Drag & drop your file or click to browse</p>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm">
                          Submit Assignment
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">All caught up!</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-1">You have no pending homework assignments.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-500" /> Submitted
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Submitted On</th>
                  <th className="px-6 py-4">Attachment</th>
                  <th className="px-6 py-4">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {submittedHomeworks.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{sub.homework.title}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sub.homework.subject.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {sub.attachmentUrl ? (
                        <span className="flex items-center gap-1 text-blue-600"><FileText size={14} /> File Attached</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.grade !== null ? (
                        <span className="font-bold text-green-600">{sub.grade}%</span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
