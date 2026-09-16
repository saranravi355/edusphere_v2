import { Users, Clock, ShieldAlert, GraduationCap, IndianRupee, MessageSquare, Plane, ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { todayRegister } from "@/lib/overview";
import { schoolDay, schoolMonthStart, schoolWeekday } from "@/lib/dates";
import { classesCaption, rupees } from "@/lib/snapshot";

interface Metric {
  label: string;
  value: string;
  /** One line under the number saying what it means, so a bare 0 is never left to be guessed at. */
  caption: string;
  icon: LucideIcon;
  href: string;
}

// Written out in full so Tailwind can see each class; a role has 3 to 5 metrics.
const GRID_COLS: Record<number, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
};

export default async function SchoolSnapshot() {
  const session = await getSession();
  if (!session) return null;

  const role = session.user.role;
  const userId = session.user.id;
  // The school's day and month, not the server's: on a UTC host, setHours(0)
  // is 05:30 IST, so until then "today" was still yesterday and on the 1st
  // "this month" was still last month.
  const { start: dayStart, end: dayEnd } = schoolDay();
  const startOfMonth = schoolMonthStart();

  let metrics: Metric[] = [];

  if (role === 'SUPER_ADMIN' || role === 'PRINCIPAL') {
    const totalStudents = await prisma.student.count();

    // Was: count today's rows, divide, and render "0.0%" when there were none.
    // On any morning before first period — or a weekend, or a holiday — that is
    // a divide by zero drawn as a number, and a school of 173 reads as though
    // not one child turned up. todayRegister() returns a null rate for "nothing
    // marked yet", which is a different fact and is shown as one. It also uses
    // the school's midnight rather than the server's: on a UTC host, setHours(0)
    // is 05:30 IST, so first period landed in the previous day's register.
    const register = await todayRegister();
    const attendance: Metric = register.rate === null
      ? { label: "Daily Attendance", value: "Not taken", caption: "Register not marked yet", icon: Clock, href: "/admin/analytics" }
      : { label: "Daily Attendance", value: `${register.rate}%`, caption: `${register.present} of ${register.marked} marked present`, icon: Clock, href: "/admin/analytics" };

    const activeIncidents = await prisma.behaviorIncident.count({
      where: { type: 'DEMERIT', date: { gte: startOfMonth } }
    });

    if (role === 'PRINCIPAL') {
      const totalTeachers = await prisma.teacher.count();
      const pendingLeave = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });

      metrics = [
        { label: "Total Students", value: totalStudents.toString(), caption: "On the roll", icon: Users, href: "/admin/students" },
        attendance,
        { label: "Active Incidents", value: activeIncidents.toString(), caption: "Demerits this month", icon: ShieldAlert, href: "/admin/behavior" },
        { label: "Teaching Staff", value: totalTeachers.toString(), caption: "On staff", icon: GraduationCap, href: "/admin/staff" },
        { label: "Pending Leave", value: pendingLeave.toString(), caption: "Awaiting approval", icon: Plane, href: "/admin/staff/leave" },
      ];
    } else {
      const revenueResult = await prisma.feeInvoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true }
      });
      const revenue = revenueResult._sum.amount || 0;
      const formattedRevenue = revenue >= 100000 ? `₹${(revenue/100000).toFixed(1)}L` : rupees(revenue);

      metrics = [
        { label: "Total Students", value: totalStudents.toString(), caption: "On the roll", icon: Users, href: "/admin/users" },
        { ...attendance, href: "/admin/analytics" },
        { label: "Active Incidents", value: activeIncidents.toString(), caption: "Demerits this month", icon: ShieldAlert, href: "/admin/behavior" },
        { label: "Revenue MTD", value: formattedRevenue, caption: "Fees paid this month", icon: IndianRupee, href: "/admin/finance" },
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
        include: { attendances: { where: { date: { gte: dayStart, lt: dayEnd } } } }
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
      { label: "Class Attendance", value: attendanceRate, caption: "Your class, today", icon: Clock, href: "/teacher/attendance" },
      { label: "Pending Grading", value: pendingGrading.toString(), caption: pendingGrading === 0 ? "All marked" : "Submissions to mark", icon: GraduationCap, href: "/teacher/grading" },
      { label: "Support Required", value: supportRequired.toString(), caption: "Demerits this month", icon: ShieldAlert, href: "/teacher/students" },
    ];
  }
  else if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: { attendances: { where: { date: { gte: dayStart, lt: dayEnd } } } }
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
      { label: "Children Attending", value: `${presentCount}/${children.length}`, caption: "Marked present today", icon: Users, href: "/parent/attendance" },
      { label: "Upcoming Fees", value: rupees(upcomingFees), caption: upcomingFees === 0 ? "Nothing to pay" : "Unpaid invoices", icon: IndianRupee, href: "/parent/fees" },
      { label: "New Messages", value: unreadMessages.toString(), caption: "Unread", icon: MessageSquare, href: "/parent/messages" },
    ];
  }
  else if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { classroom: true }
    });

    // The school's weekday, not the server's: timetable days run 1 = Monday …
    // 5 = Friday, and a UTC host's getDay() is still on yesterday until 05:30 IST.
    const weekday = schoolWeekday();

    const todaysClasses = student?.classroomId ? await prisma.timetableEntry.count({
      where: { classroomId: student.classroomId, dayOfWeek: weekday }
    }) : 0;

    // Only what is still to be handed in. Counting every assignment due from
    // today on included ones already submitted, so this tile and the "My
    // Homework" card beneath it could give the same student two numbers.
    const homeworkDue = student?.classroomId ? await prisma.homework.count({
      where: {
        classroomId: student.classroomId,
        dueDate: { gte: dayStart },
        submissions: { none: { studentId: student.id } },
      }
    }) : 0;

    const walletTransactions = student?.id ? await prisma.walletTransaction.findMany({ where: { studentId: student.id }}) : [];
    const balance = walletTransactions.reduce((acc, t) => t.type === 'TOP_UP' ? acc + t.amount : acc - t.amount, 0);

    metrics = [
      { label: "Today's Classes", value: todaysClasses.toString(), caption: classesCaption(todaysClasses, weekday), icon: Clock, href: "/student/timetable" },
      { label: "Homework Due", value: homeworkDue.toString(), caption: homeworkDue === 0 ? "All caught up" : "Still to hand in", icon: GraduationCap, href: "/student/homework" },
      { label: "Wallet Balance", value: rupees(balance), caption: "View wallet", icon: IndianRupee, href: "/student/wallet" },
    ];
  }

  return (
    <section className="mb-6" aria-labelledby="snapshot-heading">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <h2 id="snapshot-heading" className="font-heading text-xl text-foreground">Today&apos;s Snapshot</h2>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      <div className={`grid grid-cols-1 gap-4 ${GRID_COLS[metrics.length] ?? "sm:grid-cols-3"}`}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="group flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{m.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.caption}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
