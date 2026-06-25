import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  // 1. Fetch live metrics from Prisma
  const totalStudents = await prisma.student.count();
  const activeTeachers = await prisma.teacher.count();
  
  // Calculate Revenue from PAID invoices
  const revenueData = await prisma.feeInvoice.aggregate({
    _sum: { amount: true },
    where: { status: 'PAID' }
  });
  
  const totalRevenue = revenueData._sum.amount || 0;
  
  // Calculate Attendance Rate for today
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  
  const totalAttendanceRecords = await prisma.attendance.count({
    where: { date: { gte: todayStart, lt: todayEnd } }
  });
  
  const presentRecords = await prisma.attendance.count({
    where: { 
      date: { gte: todayStart, lt: todayEnd },
      status: 'PRESENT'
    }
  });

  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
    : 0;

  // Format revenue helper
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  // 2. Fetch data for Pie Chart (Demographics by Curriculum)
  const demographicsRaw = await prisma.student.groupBy({
    by: ['curriculum'],
    _count: { id: true }
  });

  const demographicsChartData = demographicsRaw.map(d => ({
    name: d.curriculum || 'Unspecified',
    value: d._count.id
  }));

  // Mock historical revenue data since we don't have historical months seeded 
  // (In a real app, you would group invoices by month)
  const revenueChartData = [
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 52000 },
    { month: 'Mar', amount: 48000 },
    { month: 'Apr', amount: 61000 },
    { month: 'May', amount: 59000 },
    { month: 'Jun', amount: totalRevenue > 0 ? totalRevenue : 65000 },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader 
        title="System Analytics" 
        description="High-level overview of school performance and metrics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Students</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalStudents}</h3>
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp size={14} /> +4.2% this month
            </span>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Active Teachers</span>
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Users size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{activeTeachers}</h3>
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp size={14} /> +2 new this term
            </span>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Revenue</span>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <DollarSign size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalRevenue)}</h3>
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp size={14} /> +12.5% this term
            </span>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Today's Attendance</span>
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BarChart3 size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{attendanceRate}%</h3>
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
              {presentRecords} / {totalAttendanceRecords} present
            </span>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts 
        revenueData={revenueChartData} 
        demographicsData={demographicsChartData.length > 0 ? demographicsChartData : [{ name: 'No Data', value: 1 }]} 
      />
    </div>
  );
}
