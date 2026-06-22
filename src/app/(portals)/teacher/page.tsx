import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle2 } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TeacherAssignmentModal from "@/components/ui/TeacherAssignmentModal";
import { markAttendance, assignGrade, bulkMarkPresent } from "./actions";

const prisma = new PrismaClient();

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== 'CLASS_TEACHER' && session.user.role !== 'SUBJECT_TEACHER')) {
    redirect('/');
  }

  // Get Teacher profile
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          students: {
            include: {
              attendances: { where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
              grades: true,
            }
          }
        }
      }
    }
  });

  if (!teacher || teacher.classes.length === 0) {
    return <div>No classes assigned.</div>;
  }

  const activeClass = teacher.classes[0];
  const students = activeClass.students;

  const totalStudents = students.length;
  const presentCount = students.filter(s => s.attendances.some(a => a.status === 'PRESENT')).length;
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-heading">Class {activeClass.name} - {teacher.subjects}</h1>
        <p className="text-slate-500">Period 1 (08:00 AM - 08:45 AM)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Class Strength</CardTitle>
            <Users className="w-4 h-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Students enrolled</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Grading</CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">0</div>
            <p className="text-xs text-orange-500 mt-1">Assignments need review</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Attendance Today</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{presentCount}/{totalStudents}</div>
            <p className="text-xs text-green-500 mt-1">{Math.round((presentCount/totalStudents)*100 || 0)}% Present</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Class Roster */}
        <Card className="glass-card col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Class Roster</CardTitle>
            <form action={async () => {
              "use server";
              await bulkMarkPresent(activeClass.id);
            }}>
              <button type="submit" className="text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg font-medium transition-colors border border-teal-200 shadow-sm active:scale-95">
                Mark All Present
              </button>
            </form>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 text-left font-medium">Registration</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Current Grade</th>
                    <th className="p-3 text-left font-medium">Quick Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => {
                    const todayAtt = student.attendances[0];
                    const bioGrade = student.grades[0];
                    
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                        <td className="p-3 font-medium text-slate-500">{student.registrationNo}</td>
                        <td className="p-3 font-semibold">{student.name}</td>
                        <td className="p-3">
                          <form action={assignGrade} className="flex gap-2">
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="number" name="score" defaultValue={bioGrade?.score} className="w-16 px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700" />
                            <button type="submit" className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors">Save</button>
                          </form>
                        </td>
                        <td className="p-3 flex gap-2">
                          <form action={markAttendance}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="hidden" name="status" value="PRESENT" />
                            <button type="submit" className={`px-3 py-1 rounded-full text-xs font-medium transition ${todayAtt?.status === 'PRESENT' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}>Present</button>
                          </form>
                          <form action={markAttendance}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="hidden" name="status" value="ABSENT" />
                            <button type="submit" className={`px-3 py-1 rounded-full text-xs font-medium transition ${todayAtt?.status === 'ABSENT' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}>Absent</button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Timetable & Assignments */}
        <div className="space-y-6 col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                <div className="relative pl-8">
                  <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">08:00 AM - 08:45 AM</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Biology (Class 9A)</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-950" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">09:00 AM - 09:45 AM</p>
                  <p className="text-xs text-slate-400">Free Period</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-white dark:ring-slate-950" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">10:00 AM - 10:45 AM</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Chemistry (Class 10B)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Assignment Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherAssignmentModal />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
