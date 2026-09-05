import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { FileSpreadsheet, CalendarDays, ArrowRight, Users, GraduationCap, CalendarRange, LayoutGrid } from "lucide-react";
import AIFeatureLink from "@/components/ai/AIFeatureLink";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Academic Setup & Import.
 *
 * This page had three "Select File" dropzones and three "Download Template"
 * buttons. All six were inert — the dropzones were divs with `cursor-pointer`
 * and no input, in a Server Component where a handler was not even possible.
 * Underneath sat a "Recent Imports" list showing sections_2026_fall.csv
 * (450 records, 2 hours ago) and a failed timetables_master_v2.xlsx: hardcoded
 * markup, presented as this school's import history.
 *
 * Two working bulk importers already exist, and the timetable has its own
 * manager and solver. This page routes to them and reports what is really in
 * the database instead of inventing an audit trail.
 */
export default async function AcademicSetupPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const [studentCount, teacherCount, timetableCount, classCount, newestStudent, newestTimetable] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.timetableEntry.count(),
    prisma.classroom.count(),
    prisma.student.findFirst({ orderBy: { enrollmentDate: "desc" }, select: { enrollmentDate: true } }),
    prisma.timetableEntry.findFirst({ orderBy: { id: "desc" }, select: { classroom: { select: { name: true } } } }),
  ]);

  const classesWithTimetable = await prisma.timetableEntry.groupBy({ by: ["classroomId"], _count: { _all: true } });

  const tools = [
    {
      href: "/admin/students/import",
      title: "Students",
      blurb: "Upload a spreadsheet of students. Creates their records, portal logins and linked parents in one pass.",
      cta: "Open the student importer",
      icon: GraduationCap,
      tone: "bg-green-50 dark:bg-green-900/20 text-green-600",
      stat: `${studentCount} students on roll`,
    },
    {
      href: "/admin/staff/import",
      title: "Staff",
      blurb: "Upload a spreadsheet of teachers. Creates staff records and portal logins.",
      cta: "Open the staff importer",
      icon: Users,
      tone: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
      stat: `${teacherCount} teachers on staff`,
    },
    {
      href: "/admin/academic-setup/timetable",
      title: "Timetables",
      blurb: "Build the week by hand, or let the solver fill a class in one pass without double-booking anyone.",
      cta: "Open the timetable manager",
      icon: CalendarRange,
      tone: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
      stat: `${classesWithTimetable.length} of ${classCount} classes scheduled`,
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Academic Setup & Import"
        description="Bring students, staff and timetables into the system."
      />

      <AIFeatureLink
        href="/admin/ai-insights/capacity-optimizer"
        icon={<LayoutGrid size={15} />}
        title="Class Capacity Optimizer"
        description="Balances section sizes and room allocation across the timetable."
      />

      <Link href="/admin/academic-setup/calendar" className="group block">
        <div className="bg-primary rounded-2xl p-5 shadow-sm flex items-center justify-between text-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} aria-hidden />
            <div>
              <p className="font-bold">Academic Calendar</p>
              <p className="text-xs text-emerald-100">Terms, holidays and exam windows — sync national and IB calendars.</p>
            </div>
          </div>
          <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Open →</span>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((t) => (
          <div key={t.href} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col text-center items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${t.tone}`}>
              <t.icon size={32} aria-hidden />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4 flex-1">{t.blurb}</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-4">{t.stat}</p>
            <Link
              href={t.href}
              className="w-full py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 text-sm"
            >
              {t.cta} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">What is loaded</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Counted from the database. This panel previously listed two imports that never happened.
        </p>
        <dl className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="text-green-500" size={18} aria-hidden /> Students
            </dt>
            <dd className="text-slate-500 text-right">
              {studentCount} on roll
              {newestStudent && <span className="block text-xs text-slate-400">most recent enrolment {formatDate(newestStudent.enrollmentDate, "dMonYy")}</span>}
            </dd>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="text-purple-500" size={18} aria-hidden /> Staff
            </dt>
            <dd className="text-slate-500">{teacherCount} teachers</dd>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="text-blue-500" size={18} aria-hidden /> Timetable
            </dt>
            <dd className="text-slate-500 text-right ml-auto">
              {timetableCount} periods across {classesWithTimetable.length} class{classesWithTimetable.length === 1 ? "" : "es"}
              {newestTimetable?.classroom?.name && (
                <span className="block text-xs text-slate-400">most recently {newestTimetable.classroom.name}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
