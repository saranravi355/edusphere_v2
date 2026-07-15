import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Award, Download } from "lucide-react";



export default async function ParentGradesPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          classroom: true,
          grades: {
            include: { subject: true },
            orderBy: { date: 'desc' }
          }
        }
      }
    }
  });

  if (!parent || parent.students.length === 0) return null;
  
  const student = parent.students[0];
  const grades = student.grades;

  // Calculate Average
  const averageGrade = grades.length > 0 
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) 
    : 0;

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader 
        title="Gradebook" 
        description={`Academic progress and report cards for ${student.name}.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Average</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{averageGrade}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Subject Performance</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Download size={16} /> Download Official PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Assessments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Assessment Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {grades.map(grade => (
                <tr key={grade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{grade.examName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{grade.subject.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(grade.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-medium uppercase tracking-wider">
                      Term Exam
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{grade.score}%</span>
                      <div className="flex-1 max-w-[100px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${grade.score >= 80 ? 'bg-green-500' : grade.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${grade.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {grades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No grades published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
