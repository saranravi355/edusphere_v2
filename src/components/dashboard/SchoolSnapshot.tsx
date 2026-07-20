import { Users, Clock, ShieldAlert, GraduationCap, DollarSign, MessageSquare, Plane, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export default async function SchoolSnapshot() {
  const session = await getSession();
  if (!session) return null;

  const role = session.user.role;
  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  interface Metric {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    href: string;
  }

  let metrics: Metric[] = [];

  if (role === 'SUPER_ADMIN' || role === 'PRINCIPAL') {
    const totalStudents = await prisma.student.count();

    const todayAttendances = await prisma.attendance.findMany({
      where: { date: { gte: today } }
    });
    const presentCount = todayAttendances.filter(a => a.status === 'PRESENT').length;
    const totalMarked = todayAttendances.length;
    const attendanceRate = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) + '%' : "0.0%";

    const activeIncidents = await prisma.behaviorIncident.count({
      where: { type: 'DEMERIT', date: { gte: startOfMonth } }
    });

    if (role === 'PRINCIPAL') {
      const totalTeachers = await prisma.teacher.count();
      const pendingLeave = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });

      metrics = [
        { label: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/admin/students" },
        { label: "Daily Attendance", value: attendanceRate, icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/admin/analytics" },
        { label: "Active Incidents", value: activeIncidents.toString(), icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", href: "/admin/behavior" },
        { label: "Teaching Staff", value: totalTeachers.toString(), icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30", href: "/admin/staff" },
        { label: "Pending Leave", value: pendingLeave.toString(), icon: Plane, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/admin/staff/leave" },
      ];
    } else {
      const revenueResult = await prisma.feeInvoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true }
      });
      const revenue = revenueResult._sum.amount || 0;
      const formattedRevenue = revenue >= 100000 ? `₹${(revenue/100000).toFixed(1)}L` : `₹${revenue.toLocaleString()}`;

      metrics = [
        { label: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/admin/users" },
        { label: "Daily Attendance", value: attendanceRate, icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/admin/analytics" },
        { label: "Active Incidents", value: activeIncidents.toString(), icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", href: "/admin/behavior" },
        { label: "Revenue MTD", value: formattedRevenue, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", href: "/admin/finance" },
      ];
    }
  }
  else if (role === 'CLASS_TEACHER' || role === 'SUBJECT_TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { classes: true }
    });

    let attendanceRate = "0%";
    if (teacher && teacher.classes.length > 0) {
      const classId = teacher.classes[0].id;
      const classStudents = await prisma.student.findMany({
        where: { classroomId: classId },
        include: { attendances: { where: { date: { gte: today } } } }
      });
      const total = classStudents.length;
      const present = classStudents.filter(s => s.attendances.some(a => a.status === 'PRESENT')).length;
      attendanceRate = total > 0 ? Math.round((present / total) * 100) + '%' : "0%";
    }

    const pendingGrading = await prisma.homeworkSubmission.count({
      where: { grade: null, homework: { teacherId: teacher?.id } }
    });

    const supportRequired = await prisma.behaviorIncident.count({
      where: { teacherId: teacher?.id, type: 'DEMERIT', date: { gte: startOfMonth } }
    });

    metrics = [
      { label: "Class Attendance", value: attendanceRate, icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/teacher/attendance" },
      { label: "Pending Grading", value: pendingGrading.toString(), icon: GraduationCap, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/teacher/grading" },
      { label: "Support Required", value: supportRequired.toString(), icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", href: "/teacher/students" },
    ];
  }
  else if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: { attendances: { where: { date: { gte: today } } } }
        }
      }
    });

    const children = parent?.students || [];
    const presentCount = children.filter(s => s.attendances.some(a => a.status === 'PRESENT')).length;

    const upcomingFeesResult = await prisma.feeInvoice.aggregate({
      where: { studentId: { in: children.map(c => c.id) }, status: 'PENDING' },
      _sum: { amount: true }
    });
    const upcomingFees = upcomingFeesResult._sum.amount || 0;

    const unreadMessages = await prisma.message.count({
      where: { receiverId: userId, isRead: false }
    });

    metrics = [
      { label: "Children Attending", value: `${presentCount}/${children.length}`, icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/parent/attendance" },
      { label: "Upcoming Fees", value: `₹${upcomingFees.toLocaleString()}`, icon: DollarSign, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/parent/fees" },
      { label: "New Messages", value: unreadMessages.toString(), icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30", href: "/parent/messages" },
    ];
  }
  else if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { classroom: true }
    });

    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const todaysClasses = student?.classroomId ? await prisma.timetableEntry.count({
      where: { classroomId: student.classroomId, dayOfWeek }
    }) : 0;

    const homeworkDue = student?.classroomId ? await prisma.homework.count({
      where: { classroomId: student.classroomId, dueDate: { gte: today } }
    }) : 0;

    const walletTransactions = student?.id ? await prisma.walletTransaction.findMany({ where: { studentId: student.id }}) : [];
    const balance = walletTransactions.reduce((acc, t) => t.type === 'TOP_UP' ? acc + t.amount : acc - t.amount, 0);

    metrics = [
      { label: "Today's Classes", value: todaysClasses.toString(), icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", href: "/student/timetable" },
      { label: "Homework Due", value: homeworkDue.toString(), icon: GraduationCap, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", href: "/student/homework" },
      { label: "Wallet Balance", value: `₹${balance}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", href: "/student/wallet" },
    ];
  }

  return (
    <div className="mb-6 rounded-lg border border-border border-t-2 border-t-primary bg-card overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="p-5 lg:w-64 lg:shrink-0 lg:border-r border-border">
          <h2 className="font-heading text-xl text-foreground">Today&apos;s Snapshot</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            const content = (
              <div className="flex items-center gap-3 px-5 py-4 h-full hover:bg-muted/50 transition-colors">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{m.label}</p>
                  <p className="text-xl font-semibold text-foreground mt-0.5">{m.value}</p>
                </div>
              </div>
            );
            return m.href ? (
              <Link key={i} href={m.href} className="block flex-1 min-w-0">
                {content}
              </Link>
            ) : (
              <div key={i} className="flex-1 min-w-0">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
