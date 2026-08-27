import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LiveRefresh from "./LiveRefresh";
import Link from "next/link";
import { formatDate, schoolDay } from "@/lib/dates";
import {
  CheckCircle2, ClipboardList, UserX, Stethoscope, Bus, BookOpen, IndianRupee,
  ShieldAlert, CalendarClock, Inbox, AlertTriangle,
} from "lucide-react";

/**
 * Live Operations — the school right now.
 *
 * This page answers "what is happening today, and what needs someone before
 * home time". Everything on it is an exception or a queue: a register not yet
 * taken, a child absent with no explanation, an approval waiting, a book not
 * returned, an invoice that has tipped overdue. If a panel would not make
 * somebody do something today, it belongs on /admin/analytics instead.
 *
 * The rule, stated once so it survives the next edit:
 *   Live never draws a time axis. Analytics never shows a queue.
 *
 * What this replaces: six stat cards that duplicated /admin/analytics almost
 * exactly, above a health score. The headline attendance was the worst of it —
 * it fell back to "the latest day with any register at all", which for weeks
 * was 18 August, a day holding exactly two rows. Both were present, so the
 * dashboard reported 100% attendance for a school of 157, under a pulsing LIVE
 * badge, and weighted that number at 35% of a health score. A dashboard that
 * cannot tell "nobody was marked absent" from "nobody was marked" is worse
 * than no dashboard, because it is confidently wrong.
 *
 * So the register panel now leads, and it distinguishes the three states that
 * matter: taken, partly taken, and not taken at all.
 */

export const dynamic = "force-dynamic";

export default async function LiveOperationsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const now = new Date();
  // schoolDay() gives the IST day boundaries. Doing this with setHours(0,0,0,0)
  // uses the SERVER's midnight, which on a UTC host is 05:30 IST — so the first
  // period of every morning would land in the previous day's register.
  const { start: dayStart, end: dayEnd } = schoolDay(now);
  const in48h = new Date(now.getTime() + 48 * 3600 * 1000);

  /**
   * The current term, from the school's own calendar. Live needs it for one
   * reason: to keep last year's arrears out of today's chase list. Without the
   * boundary the fee queue reads "198 invoices past due", of which about 175
   * are a year old — which buries the seventeen families who have actually
   * missed this term's payment.
   */
  const term = await prisma.academicEvent.findFirst({
    where: { type: "TERM", startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });
  const termStart = term ? new Date(term.startDate) : new Date(now.getFullYear(), 0, 1);
  const isWeekend = [0, 6].includes(now.getDay());

  const [
    classrooms, todayAttendance, absentToday, clinicToday, pendingLeave,
    overdueBooks, overdueInvoices, examsSoon, incidentsToday, routes, enrolled, olderArrears,
  ] = await Promise.all([
    prisma.classroom.findMany({ select: { id: true, name: true, _count: { select: { students: true } } }, orderBy: { name: "asc" } }),
    prisma.attendance.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { status: true, student: { select: { classroomId: true } } },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, status: { in: ["ABSENT", "LATE"] } },
      select: {
        status: true, isMedicalLeave: true,
        student: { select: { name: true, classroom: { select: { name: true } } } },
      },
      orderBy: { status: "asc" },
    }),
    prisma.clinicVisit.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { id: true, reason: true, treatment: true, student: { select: { name: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      select: { id: true, leaveType: true, startDate: true, endDate: true, teacher: { select: { user: { select: { name: true } } } } },
      orderBy: { startDate: "asc" }, take: 6,
    }),
    prisma.bookLoan.findMany({
      where: { status: "ACTIVE", dueDate: { lt: now } },
      select: { id: true, dueDate: true, book: { select: { title: true } }, user: { select: { name: true } } },
      orderBy: { dueDate: "asc" }, take: 6,
    }),
    prisma.feeInvoice.findMany({
      where: { status: { in: ["OVERDUE", "PENDING"] }, dueDate: { lt: now, gte: termStart } },
      select: { id: true, amount: true, dueDate: true, student: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.iBExamSession.findMany({
      where: { date: { gte: dayStart, lte: in48h } }, orderBy: { date: "asc" }, take: 5,
    }),
    prisma.behaviorIncident.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { id: true, type: true, category: true, student: { select: { name: true } } },
    }),
    prisma.transportRoute.findMany({
      where: { isActive: true },
      select: { id: true, name: true, vehicleNumber: true, driverName: true, capacity: true, _count: { select: { riders: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.feeInvoice.aggregate({
      _sum: { amount: true }, _count: true,
      where: { status: { in: ["OVERDUE", "PENDING"] }, dueDate: { lt: termStart } },
    }),
  ]);

  /* -------------------------------------------------- today's register -- */

  const markedByClass = new Map<string, number>();
  for (const a of todayAttendance) {
    const c = a.student.classroomId;
    if (c) markedByClass.set(c, (markedByClass.get(c) ?? 0) + 1);
  }
  const registers = classrooms.map((c) => {
    const marked = markedByClass.get(c.id) ?? 0;
    return { ...c, marked, expected: c._count.students, complete: marked >= c._count.students && c._count.students > 0 };
  });
  const complete = registers.filter((r) => r.complete).length;
  const untouched = registers.filter((r) => r.marked === 0);
  const partial = registers.filter((r) => r.marked > 0 && !r.complete);
  const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;

  const overdueTotal = overdueInvoices.reduce((n, i) => n + i.amount, 0);

  /** Everything that has somebody waiting at the other end of it. */
  const queues = [
    { n: pendingLeave.length, label: "Leave requests awaiting a decision", icon: Inbox, href: "/admin/staff", tone: "amber" },
    { n: overdueInvoices.length, label: `Invoices overdue this term · ${inr(Math.round(overdueTotal))}`, icon: IndianRupee, href: "/admin/finance/invoices", tone: "rose" },
    { n: overdueBooks.length, label: "Library books overdue", icon: BookOpen, href: "/operations/resources", tone: "amber" },
    { n: untouched.length, label: "Classes with no register taken today", icon: ClipboardList, href: "#register", tone: "rose" },
  ].filter((q) => q.n > 0);

  const TONES: Record<string, string> = {
    amber: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300",
    rose: "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300",
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <PageHeader
          title="Live Operations"
          description={`Today at the school — ${formatDate(now)}. Registers, absences, approvals and anything overdue. For trends across the term, use School Analytics.`}
        />
        <div className="mb-6"><LiveRefresh /></div>
      </div>

      {/* Needs attention. Empty when there is nothing to do, which is the point. */}
      {queues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {queues.map((q) => (
            <Link key={q.label} href={q.href}
                  className={`flex items-center gap-4 border rounded-xl px-5 py-4 transition-opacity hover:opacity-80 ${TONES[q.tone]}`}>
              <q.icon size={20} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-black leading-none">{q.n}</p>
                <p className="text-xs font-medium mt-1">{q.label}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-5 py-4">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">Nothing is waiting on the office right now.</p>
        </div>
      )}

      {olderArrears._count > 0 && (
        <p className="text-xs text-slate-400 -mt-2">
          Separately, {olderArrears._count} invoices from before {term?.title ?? "this term"} remain unpaid
          ({inr(Math.round(olderArrears._sum.amount ?? 0))}). Older arrears are a finance job rather than a
          today job, so they are counted here and chased from{" "}
          <Link href="/admin/finance/invoices" className="underline hover:text-slate-600">Finance</Link>.
        </p>
      )}

      {/* ------------------------------------------------- today's register */}
      <div id="register" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Today&rsquo;s register</h3>
          </div>
          <span className="text-xs text-slate-500">{complete} of {classrooms.length} classes complete</span>
        </div>

        {todayAttendance.length === 0 ? (
          <div className="p-5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No register has been taken today{isWeekend ? " — it is the weekend" : ""}.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                This is not the same as an attendance rate of zero, and it is deliberately not shown as one.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {Math.round((presentToday / todayAttendance.length) * 100)}%
                </p>
                <p className="text-xs text-slate-500">present of those marked</p>
                <p className="text-[11px] text-slate-400">{presentToday} of {todayAttendance.length}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{todayAttendance.length}<span className="text-sm font-normal text-slate-400"> / {enrolled}</span></p>
                <p className="text-xs text-slate-500">students accounted for</p>
                <p className="text-[11px] text-slate-400">{enrolled - todayAttendance.length} not yet marked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{partial.length + untouched.length}</p>
                <p className="text-xs text-slate-500">classes still to finish</p>
                <p className="text-[11px] text-slate-400">{partial.length} partial · {untouched.length} not started</p>
              </div>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-1.5">
              {registers.map((r) => (
                <span key={r.id}
                      title={`${r.marked} of ${r.expected} marked`}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                        r.complete ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : r.marked > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                  {r.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --------------------------------------------- absent right now */}
        <Card icon={UserX} tone="text-rose-600" title={`Absent or late today (${absentToday.length})`}>
          {absentToday.length === 0 ? (
            <Empty>Nobody is marked absent or late today.</Empty>
          ) : (
            absentToday.slice(0, 8).map((a, i) => (
              <Row key={i}
                   main={a.student.name}
                   meta={`${a.student.classroom?.name ?? "no class"} · ${a.status === "LATE" ? "late" : a.isMedicalLeave ? "absent, medical" : "absent, unexplained"}`}
                   badge={a.status === "LATE" ? "Late" : a.isMedicalLeave ? "Medical" : "Chase"}
                   badgeTone={a.status === "LATE" ? "amber" : a.isMedicalLeave ? "slate" : "rose"} />
            ))
          )}
        </Card>

        {/* ------------------------------------------ approvals waiting */}
        <Card icon={Inbox} tone="text-amber-600" title={`Awaiting the Principal (${pendingLeave.length})`}>
          {pendingLeave.length === 0 ? (
            <Empty>No leave requests are waiting.</Empty>
          ) : (
            pendingLeave.map((l) => (
              <Row key={l.id}
                   main={l.teacher.user.name}
                   meta={`${l.leaveType.toLowerCase()} leave · ${formatDate(l.startDate)} to ${formatDate(l.endDate)}`}
                   badge="Decide" badgeTone="amber" />
            ))
          )}
        </Card>

        {/* ------------------------------------------------- clinic today */}
        <Card icon={Stethoscope} tone="text-teal-600" title={`Clinic today (${clinicToday.length})`}>
          {clinicToday.length === 0 ? (
            <Empty>No clinic visits logged today.</Empty>
          ) : (
            clinicToday.map((c) => <Row key={c.id} main={c.student.name} meta={`${c.reason} · ${c.treatment}`} />)
          )}
        </Card>

        {/* ------------------------------------------------ behaviour today */}
        <Card icon={ShieldAlert} tone="text-purple-600" title={`Behaviour logged today (${incidentsToday.length})`}>
          {incidentsToday.length === 0 ? (
            <Empty>Nothing logged today.</Empty>
          ) : (
            incidentsToday.map((i) => (
              <Row key={i.id} main={i.student.name} meta={i.category}
                   badge={i.type === "MERIT" ? "Merit" : "Demerit"}
                   badgeTone={i.type === "MERIT" ? "emerald" : "rose"} />
            ))
          )}
        </Card>

        {/* -------------------------------------------------- library chase */}
        <Card icon={BookOpen} tone="text-blue-600" title={`Books overdue (${overdueBooks.length})`}>
          {overdueBooks.length === 0 ? (
            <Empty>Nothing is overdue.</Empty>
          ) : (
            overdueBooks.map((l) => (
              <Row key={l.id} main={l.book.title} meta={`${l.user.name} · due ${formatDate(l.dueDate)}`} badge="Chase" badgeTone="amber" />
            ))
          )}
        </Card>

        {/* ------------------------------------------------ buses this run */}
        <Card icon={Bus} tone="text-indigo-600" title={`Buses running (${routes.length})`}>
          {routes.length === 0 ? (
            <Empty>No active routes.</Empty>
          ) : (
            routes.map((r) => (
              <Row key={r.id} main={r.name}
                   meta={`${r.vehicleNumber} · ${r.driverName}`}
                   badge={`${r._count.riders}/${r.capacity}`}
                   badgeTone={r._count.riders >= r.capacity ? "rose" : "slate"} />
            ))
          )}
        </Card>
      </div>

      {/* ------------------------------------------ next 48 hours only */}
      {examsSoon.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
            <CalendarClock size={15} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">IB assessments in the next 48 hours</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
            {examsSoon.map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {e.subjectName}{e.level ? ` ${e.level}` : ""} — {e.paper}
                  </p>
                  <p className="text-[11px] text-slate-400">{e.session}{e.room ? ` · ${e.room}` : ""}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(e.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ fragments -- */

function Card({ icon: Icon, tone, title, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
        <Icon size={15} className={tone} />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-5 text-xs text-slate-400">{children}</p>;
}

const BADGE: Record<string, string> = {
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function Row({ main, meta, badge, badgeTone = "slate" }: {
  main: string; meta?: string; badge?: string; badgeTone?: string;
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{main}</p>
        {meta && <p className="text-[11px] text-slate-400 truncate">{meta}</p>}
      </div>
      {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${BADGE[badgeTone]}`}>{badge}</span>}
    </div>
  );
}
