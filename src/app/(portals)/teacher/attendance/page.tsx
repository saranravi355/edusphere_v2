import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";



export default async function TeacherAttendancePage() {
  const session = await getSession();
  if (!session || !['CLASS_TEACHER', 'SUBJECT_TEACHER'].includes(session.user.role)) {
    redirect("/");
  }

  // Find the teacher's active classes
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          students: {
            include: {
              attendances: {
                where: {
                  date: {
                    gte: new Date(new Date().setHours(0,0,0,0)),
                    lt: new Date(new Date().setHours(23,59,59,999))
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!teacher || teacher.classes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance Records" />
        <p className="text-slate-500">You are not assigned to any classes.</p>
      </div>
    );
  }

  const activeClass = teacher.classes[0] || { name: "10A Science" };
  const dbStudents = teacher.classes[0]?.students || [];
  
  // Demo fallback
  const students = dbStudents.length > 0 ? dbStudents : [
    { id: "1", name: "Aarav Patel", registrationNo: "ST-2026-001", attendances: [] },
    { id: "2", name: "Priya Sharma", registrationNo: "ST-2026-002", attendances: [{ status: "PRESENT" }] },
    { id: "3", name: "Rohan Kumar", registrationNo: "ST-2026-003", attendances: [] },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader 
        title="Daily Attendance" 
        description={`Marking attendance for Class ${activeClass.name}`}
        action={
          <div className="flex gap-2">
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
              Offline Sync
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
              Save Attendance
            </button>
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4 text-center">Morning Session</th>
              <th className="px-6 py-4 text-center">Afternoon Session</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map(student => {
              const todayAtt = student.attendances[0];
              const isPresent = todayAtt?.status === 'PRESENT';
              
              return (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{student.name}</div>
                    <div className="text-xs text-slate-500">{student.registrationNo}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className={`p-1.5 rounded-md transition-colors ${isPresent ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'}`}>
                        <CheckCircle2 size={20} />
                      </button>
                      <button className={`p-1.5 rounded-md transition-colors ${!isPresent && todayAtt ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'}`}>
                        <XCircle size={20} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex justify-center gap-2">
                      <button className={`p-1.5 rounded-md transition-colors ${isPresent ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'}`}>
                        <CheckCircle2 size={20} />
                      </button>
                      <button className={`p-1.5 rounded-md transition-colors ${!isPresent && todayAtt ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'}`}>
                        <XCircle size={20} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {todayAtt ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {todayAtt.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
