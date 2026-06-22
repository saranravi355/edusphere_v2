import PageHeader from "@/components/ui/PageHeader";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Clock, Calendar as CalendarIcon, CheckCircle2, XCircle } from "lucide-react";

const prisma = new PrismaClient();

export default async function ParentAttendancePage() {
  const session = await getSession();
  if (!session || session.user.role !== 'PARENT') {
    redirect("/");
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          attendances: {
            orderBy: { date: 'desc' },
            take: 30
          }
        }
      }
    }
  });

  if (!parent || parent.students.length === 0) {
    return <div className="p-8">No students linked to this account.</div>;
  }

  const student = parent.students[0];
  const attendances = student.attendances;
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  const percentage = Math.round((presentCount / (attendances.length || 1)) * 100);

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <PageHeader 
        title={`${student.name}'s Attendance`}
        description="Live attendance tracking and historical records."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Attendance Rate</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{percentage}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Days Present</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{presentCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Days Absent</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{attendances.length - presentCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Last 30 Days</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {attendances.length > 0 ? attendances.map(record => (
            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${record.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                  {record.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-500">No recent attendance records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
