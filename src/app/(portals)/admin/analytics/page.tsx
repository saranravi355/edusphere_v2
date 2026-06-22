import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'PRINCIPAL'].includes(session.user.role)) {
    redirect("/");
  }

  // Mock data for analytics
  const metrics = {
    totalStudents: 1250,
    activeTeachers: 85,
    revenue: "$1.2M",
    attendanceRate: "94%"
  };

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
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{metrics.totalStudents}</h3>
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp size={14} /> +4.2% this month
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
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{metrics.revenue}</h3>
            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
              <TrendingUp size={14} /> +12.5% this term
            </span>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Avg Attendance</span>
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BarChart3 size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{metrics.attendanceRate}</h3>
            <span className="text-sm font-medium text-red-500 flex items-center gap-1">
              <TrendingUp size={14} className="rotate-180" /> -1.2% this week
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Mock Chart Area */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
               {/* Pure CSS Bar Chart Mock */}
               <div className="flex items-end justify-around w-full h-full p-4 gap-2">
                  {[40, 65, 45, 80, 55, 90].map((h, i) => (
                    <div key={i} className="w-full bg-blue-500/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Enrollment Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center gap-4">
               {/* Pure CSS Pie Chart Mock */}
               <div className="w-32 h-32 rounded-full conic-gradient-mock border-4 border-white dark:border-slate-900 shadow-md"></div>
               <style dangerouslySetInnerHTML={{__html: `
                 .conic-gradient-mock {
                   background: conic-gradient(from 0deg, #3b82f6 0deg 180deg, #8b5cf6 180deg 270deg, #10b981 270deg 360deg);
                 }
               `}} />
               <div className="flex gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Primary</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Middle</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> High</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
