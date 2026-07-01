import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ArrowLeft, User as UserIcon, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default async function TeacherStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      classroom: true,
      grades: { include: { subject: true }, orderBy: { date: 'desc' }, take: 10 },
      attendances: true,
    }
  });

  if (!student) notFound();

  const totalDays = student.attendances.length;
  const presentDays = student.attendances.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "—";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link href="/teacher/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <PageHeader
        title={student.name || "Student Profile"}
        description={`Grade ${student.classroom?.gradeLevel ?? "—"} • ${student.classroom?.name || "Unassigned"}`}
        action={
          <Link href={`/teacher/students/${student.id}/ai-analysis`}>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium rounded-lg transition-colors text-sm">
              <BrainCircuit size={16} />
              AI Insights
            </button>
          </Link>
        }
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserIcon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{student.name}</h3>
            <p className="text-sm text-slate-500">{student.registrationNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Curriculum</p>
            <p className="text-slate-700 dark:text-slate-300">{student.curriculum || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Attendance Rate</p>
            <p className="text-slate-700 dark:text-slate-300">{attendanceRate}{attendanceRate !== "—" ? "%" : ""}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Blood Group</p>
            <p className="text-slate-700 dark:text-slate-300">{student.bloodGroup || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Learning Needs</p>
            <p className="text-slate-700 dark:text-slate-300">{student.learningNeeds || "None noted"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Grades</h4>
        {student.grades.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {student.grades.map(g => (
              <div key={g.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{g.subject.name}</p>
                  <p className="text-slate-500 text-xs">{g.examName}</p>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">{g.score}/{g.maxScore}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No grades recorded yet.</p>
        )}
      </div>
    </div>
  );
}
