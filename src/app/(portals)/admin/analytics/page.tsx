import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import { Users, DollarSign, Clock, TrendingUp, GraduationCap } from "lucide-react";

function formatCurrency(amount: number) {
  return amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${amount.toLocaleString()}`;
}

export default async function AdminAnalyticsPage() {
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

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const paidInvoices = await prisma.feeInvoice.findMany({
    where: { status: 'PAID', paidAt: { gte: startOfYear } }
  });
  const revenueByMonth: Record<string, number> = {};
  paidInvoices.forEach(inv => {
    if (inv.paidAt) {
      const month = monthNames[inv.paidAt.getMonth()];
      revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amount;
    }
  });
  const revenueData = monthNames.slice(0, today.getMonth() + 1).map(month => ({
    month,
    amount: revenueByMonth[month] || 0
  }));
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Attendance trend (used instead of revenue for the Principal view)
  const yearAttendances = await prisma.attendance.findMany({ where: { date: { gte: startOfYear } } });
  const attendanceByMonth: Record<string, { present: number; total: number }> = {};
  yearAttendances.forEach(a => {
    const month = monthNames[a.date.getMonth()];
    if (!attendanceByMonth[month]) attendanceByMonth[month] = { present: 0, total: 0 };
    attendanceByMonth[month].total += 1;
    if (a.status === 'PRESENT') attendanceByMonth[month].present += 1;
  });
  const attendanceTrendData = monthNames.slice(0, today.getMonth() + 1).map(month => {
    const bucket = attendanceByMonth[month];
    return { month, rate: bucket && bucket.total > 0 ? Math.round((bucket.present / bucket.total) * 100) : 0 };
  });

  const classrooms = await prisma.classroom.findMany({ include: { _count: { select: { students: true } } } });
  const demographicsData = classrooms.map(c => ({ name: `Grade ${c.gradeLevel}`, value: c._count.students })).filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="School Analytics"
        description={isPrincipal
          ? "Academic performance, attendance, and enrollment insights."
          : "Comprehensive insights into enrollment, attendance, and revenue."}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalStudents}</p>
          <p className="text-sm text-slate-500">Total Students</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{attendanceRate}%</p>
          <p className="text-sm text-slate-500">Today&apos;s Attendance</p>
        </div>

        {isPrincipal ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <GraduationCap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalTeachers}</p>
            <p className="text-sm text-slate-500">Teaching Staff</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-slate-500">YTD Revenue</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{classrooms.length}</p>
          <p className="text-sm text-slate-500">Active Classrooms</p>
        </div>
      </div>

      <AnalyticsCharts
        revenueData={revenueData}
        demographicsData={demographicsData}
        attendanceTrendData={attendanceTrendData}
        showRevenue={!isPrincipal}
      />
    </div>
  );
}
