import { Card, CardContent } from "@/components/ui/card";
import { Info, Users, Clock, ShieldAlert, GraduationCap, DollarSign } from "lucide-react";
import Link from "next/link";

export default function SchoolSnapshot({ role }: { role: string }) {
  // Mock data based on role scoping
  const data = {
    ADMIN: {
      metrics: [
        { label: "Total Students", value: "1,245", icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/admin/users" },
        { label: "Daily Attendance", value: "96.4%", icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/admin/analytics" },
        { label: "Active Incidents", value: "3", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", href: "/admin/behavior" },
        { label: "Revenue MTD", value: "₹24.5L", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", href: "/admin/analytics" },
      ]
    },
    CLASS_TEACHER: {
      metrics: [
        { label: "Class Attendance", value: "92%", icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/teacher/attendance" },
        { label: "Pending Grading", value: "14", icon: GraduationCap, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/teacher/grading" },
        { label: "Support Required", value: "2", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", href: "/teacher/students" },
      ]
    },
    PARENT: {
      metrics: [
        { label: "Children Attending", value: "2/2", icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/parent/attendance" },
        { label: "Upcoming Fees", value: "₹15,000", icon: DollarSign, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/parent/fees" },
        { label: "New Messages", value: "1", icon: Info, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30", href: "/parent/messages" },
      ]
    },
    STUDENT: {
      metrics: [
        { label: "Today's Classes", value: "6", icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/student/timetable" },
        { label: "Homework Due", value: "2", icon: GraduationCap, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/student/homework" },
        { label: "Wallet Balance", value: "₹450", icon: DollarSign, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/student/wallet" },
      ]
    }
  };

  const roleKey = role === 'SUBJECT_TEACHER' ? 'CLASS_TEACHER' : role;
  const metrics = data[roleKey as keyof typeof data]?.metrics || data.ADMIN.metrics;

  return (
    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md border-none overflow-hidden mb-6">
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Info size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold font-heading mb-1">Today's Snapshot</h2>
            <p className="text-slate-300 text-sm">Key metrics for {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              const content = (
                <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 cursor-pointer h-full">
                  <div className={`p-2 rounded-lg ${m.bg}`}>
                    <Icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">{m.label}</p>
                    <p className="text-xl font-bold">{m.value}</p>
                  </div>
                </div>
              );

              return m.href ? (
                <Link key={i} href={m.href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={i}>{content}</div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
