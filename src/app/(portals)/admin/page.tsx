import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, AlertTriangle, TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminActionModals from "@/components/ui/AdminActionModals";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";



export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect('/');
  }

  const studentCount = await prisma.student.count();
  const teacherCount = await prisma.teacher.count();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendances = await prisma.attendance.findMany({
    where: { date: { gte: today } }
  });

  const presentCount = todayAttendances.filter(a => a.status === 'PRESENT').length;
  const totalMarked = todayAttendances.length;
  const attendanceRate = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <SchoolSnapshot role={session.user.role} />
      
      <div>
        <h1 className="text-3xl font-bold font-heading">School Health Score</h1>
        <p className="text-slate-500">Overview of {studentCount} students and {teacherCount} staff members.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Enrollment</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{studentCount}</div>
            <p className="text-xs text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> Active Students</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Today's Attendance</CardTitle>
            <BookOpen className="w-4 h-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{attendanceRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{presentCount} / {studentCount} present</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Students at Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">0</div>
            <p className="text-xs text-orange-500 mt-1">Requires intervention</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Teachers</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{teacherCount}</div>
            <p className="text-xs text-slate-500 mt-1">Staff members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Quick Actions Menu */}
        <Card className="glass-card col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminActionModals />
          </CardContent>
        </Card>

        {/* Live System Logs */}
        <Card className="glass-card col-span-2">
          <CardHeader>
            <CardTitle>Live System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Meena Krishnan marked attendance for Class 9A</p>
                  <p className="text-xs text-slate-500 mt-0.5">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Rahul Patel paid Term 1 tuition fees</p>
                  <p className="text-xs text-slate-500 mt-0.5">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">System database initialized and seeded</p>
                  <p className="text-xs text-slate-500 mt-0.5">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
