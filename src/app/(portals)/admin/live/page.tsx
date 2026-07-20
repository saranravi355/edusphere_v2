import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LiveRefresh from "./LiveRefresh";
import {
  Users, GraduationCap, CheckCircle2, DollarSign, ShieldAlert, Stethoscope,
  CalendarClock, Bell, HeartHandshake, Activity, BookOpen, MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LiveDashboardPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const weekAhead = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
  const latestAttendanceDay = await prisma.attendance.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
  const attDayStart = latestAttendanceDay ? new Date(new Date(latestAttendanceDay.date).setHours(0, 0, 0, 0)) : dayStart;
  const attDayEnd = new Date(attDayStart.getTime() + 24 * 3600 * 1000);

  const [
    studentCount, teacherCount, presentToday, totalToday,
    feePaid, feePending, incidentsWeek, clinicWeek,
    upcomingExams, recentMessages, recentIncidents, activeIEP, lessonPlansDelivered, lessonPlansTotal,
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.teacher.count(),
    prisma.attendance.count({ where: { date: { gte: attDayStart, lt: attDayEnd }, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: { gte: attDayStart, lt: attDayEnd } } }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true }, where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.behaviorIncident.count({ where: { date: { gte: weekAgo } } }),
    prisma.clinicVisit.count(),
    prisma.iBExamSession.findMany({ where: { date: { gte: now, lte: weekAhead } }, orderBy: { date: "asc" }, take: 5 }),
    prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 3, include: { sender: { select: { name: true } } } }),
    prisma.behaviorIncident.findMany({ orderBy: { date: "desc" }, take: 3, include: { student: { select: { name: true } } } }),
    prisma.iEPPlan.count({ where: { status: "ACTIVE" } }),
    prisma.lessonPlan.count({ where: { status: "DELIVERED" } }),
    prisma.lessonPlan.count(),
  ]);

  const attendancePct = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
  const collected = feePaid._sum.amount || 0;
  const outstanding = feePending._sum.amount || 0;
  const collectionPct = collected + outstanding > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;
  const coverage = lessonPlansTotal > 0 ? Math.round((lessonPlansDelivered / lessonPlansTotal) * 100) : 0;
  const healthScore = Math.round(attendancePct * 0.35 + collectionPct * 0.25 + Math.max(0, 100 - incidentsWeek * 5) * 0.2 + Math.min(100, coverage + 40) * 0.2);
  const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

  const cards = [
    { label: "Attendance (latest day)", value: `${attendancePct}%`, sub: `${presentToday}/${totalToday} present`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Students enrolled", value: studentCount, sub: `${activeIEP} active IEP plans`, icon: GraduationCap, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Teaching staff", value: teacherCount, sub: `${coverage}% lesson coverage`, icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
    { label: "Fees collected", value: inr(collected), sub: `${inr(outstanding)} outstanding · ${collectionPct}%`, icon: DollarSign, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "Incidents (7 days)", value: incidentsWeek, sub: "behaviour reports", icon: ShieldAlert, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400" },
    { label: "Clinic visits", value: clinicWeek, sub: "total logged", icon: Stethoscope, color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400" },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <PageHeader
          title="Live School Dashboard"
          description="Real-time operational view straight from the database — refreshes itself every 30 seconds."
        />
        <div className="mb-6"><LiveRefresh /></div>
      </div>

      {/* Health score banner */}
      <div className="bg-primary rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-100 flex items-center gap-1.5"><Activity size={14} /> School Health Score</p>
          <p className="text-4xl font-black mt-1">{healthScore} <span className="text-lg font-normal text-blue-100">/ 100</span></p>
          <p className="text-xs text-blue-100 mt-1">Weighted: attendance 35% · fee collection 25% · behaviour 20% · curriculum coverage 20%</p>
        </div>
        <div className="hidden md:block w-28 h-28 rounded-full border-8 border-white/30 relative">
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-black">{healthScore}</div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 truncate">{s.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming IB assessments */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <CalendarClock size={15} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Upcoming IB assessments (14 days)</h3>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="p-5 text-xs text-slate-400">No assessments in the next two weeks.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
              {upcomingExams.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{e.subjectName}{e.level ? ` ${e.level}` : ""} — {e.paper}</p>
                    <p className="text-[11px] text-slate-400">{e.session}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{e.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <Bell size={15} className="text-purple-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Latest activity</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
            {recentMessages.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-start gap-3">
                <MessageSquare size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 truncate"><b>{m.sender.name}</b>: {m.subject}</p>
                  <p className="text-[11px] text-slate-400">{m.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · message</p>
                </div>
              </div>
            ))}
            {recentIncidents.map((i) => (
              <div key={i.id} className="px-5 py-3 flex items-start gap-3">
                <ShieldAlert size={14} className={`mt-0.5 flex-shrink-0 ${i.type === "MERIT" ? "text-emerald-500" : "text-rose-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 truncate"><b>{i.student.name}</b>: {i.category} ({i.points > 0 ? "+" : ""}{i.points} pts)</p>
                  <p className="text-[11px] text-slate-400">{i.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · behaviour</p>
                </div>
              </div>
            ))}
            {recentMessages.length + recentIncidents.length === 0 && (
              <p className="p-5 text-xs text-slate-400">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        {[
          { label: "IEP support", value: activeIEP, icon: HeartHandshake, href: "learning support plans active" },
          { label: "Lesson plans delivered", value: `${lessonPlansDelivered}/${lessonPlansTotal}`, icon: BookOpen, href: "curriculum coverage tracking" },
          { label: "Collection rate", value: `${collectionPct}%`, icon: DollarSign, href: "of invoiced fees received" },
        ].map((x) => (
          <div key={x.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <x.icon size={18} className="mx-auto text-slate-400 mb-1" />
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{x.value}</p>
            <p className="text-[11px] text-slate-400">{x.label} · {x.href}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
