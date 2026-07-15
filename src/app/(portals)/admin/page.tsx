import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SchoolSnapshot from "@/components/dashboard/SchoolSnapshot";
import AdminActionModals from "@/components/ui/AdminActionModals";
import prisma from "@/lib/prisma";
import { Users, GraduationCap, AlertTriangle, Plane, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
    redirect("/");
  }
  const isPrincipal = session.user.role === 'PRINCIPAL';

  const totalStudents = await prisma.student.count();
  const totalTeachers = await prisma.teacher.count();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendances = await prisma.attendance.findMany({ where: { date: { gte: today } } });
  const presentCount = todayAttendances.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = todayAttendances.length > 0 ? ((presentCount / todayAttendances.length) * 100).toFixed(1) : "0.0";

  const recentIncidents = await prisma.behaviorIncident.findMany({
    where: { type: 'DEMERIT' },
    orderBy: { date: 'desc' },
    take: 5,
    include: { student: true }
  });

  // Principal-only: staff leave queue instead of financial quick-actions
  const pendingLeaveRequests = isPrincipal ? await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { appliedAt: 'desc' },
    take: 5,
    include: { teacher: { include: { user: true } } }
  }) : [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(' ')[0] || 'Admin'}`}
        description={isPrincipal
          ? "Here's the academic and pastoral picture across your school today."
          : "Here's what's happening across your school today."}
      />

      <SchoolSnapshot />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{attendanceRate}%</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Behavior Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{incident.student.name}</p>
                        <p className="text-xs text-slate-500">{incident.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(incident.date).toLocaleDateString('en-GB')}</span>
                  </div>
                ))}
                {recentIncidents.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">No recent incidents.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminActionModals />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-blue-500 mb-1" />
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalStudents}</p>
                <p className="text-xs text-slate-500">Students</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <GraduationCap className="w-6 h-6 text-purple-500 mb-1" />
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalTeachers}</p>
                <p className="text-xs text-slate-500">Teachers</p>
              </div>
            </CardContent>
          </Card>

          {isPrincipal && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Staff Leave Queue</CardTitle>
                <Plane className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingLeaveRequests.map((lr) => (
                    <div key={lr.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lr.teacher.user.name}</p>
                        <p className="text-xs text-slate-500">{new Date(lr.startDate).toLocaleDateString('en-GB')} – {new Date(lr.endDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Pending
                      </span>
                    </div>
                  ))}
                  {pendingLeaveRequests.length === 0 && (
                    <p className="text-sm text-slate-400 py-4 text-center">No pending leave requests.</p>
                  )}
                </div>
                <Link href="/admin/staff/leave" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
                  <BookOpen size={14} /> Review all
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
