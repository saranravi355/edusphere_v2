import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AnalyticsBoard from "@/components/admin/AnalyticsBoard";
import { TrendingDown, Users, IndianRupee, GraduationCap, Award } from "lucide-react";

/**
 * School Analytics — the school over an academic year.
 *
 * This page answers "what is the pattern, and what should we change this
 * term". It shows distributions, trends, cohorts and outliers. It deliberately
 * shows NOTHING you can act on today: no queues, no approvals, no lists of
 * people to chase. That is /admin/live's job, and keeping the two apart is the
 * only thing that stopped them converging into the same page of stat cards,
 * which is what they had become.
 *
 * The rule, stated once so it survives the next edit:
 *   Analytics never shows a queue. Live never draws a time axis.
 *
 * Two bugs this replaces, both from measuring the wrong window:
 *
 *   - "YTD Revenue" filtered payments from 1 January of the CALENDAR year.
 *     Every payment on file belonged to the previous academic year, so it
 *     matched nothing and the page reported ₹0 revenue while /admin/live, which
 *     summed every paid invoice regardless of date, reported a healthy figure.
 *     Same database, same moment, two different answers.
 *   - "Today's Attendance" divided by today's register. On any day the register
 *     had not been taken — a holiday, a weekend, or simply before first period
 *     — that is a divide by zero rendered as 0.0%, indistinguishable from a
 *     school where nobody turned up.
 *
 * Both are gone: everything below is scoped to the academic year and the term
 * that AcademicEvent actually says the school is in, and a window with no data
 * says so rather than drawing itself as a zero.
 */

export const dynamic = "force-dynamic";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);
const lakh = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const IB_GROUPS: Record<number, string> = {
  1: "Gp 1 · Language A", 2: "Gp 2 · Language Acq.", 3: "Gp 3 · Individuals & Soc.",
  4: "Gp 4 · Sciences", 5: "Gp 5 · Mathematics", 6: "Gp 6 · Arts",
};

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");
  const isPrincipal = session.user.role === "PRINCIPAL";

  const now = new Date();

  /** The school's own calendar decides the window — not the calendar year. */
  const term = await prisma.academicEvent.findFirst({
    where: { type: "TERM", startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });
  const termStart = term ? new Date(term.startDate) : new Date(now.getFullYear(), 5, 1);

  const [attendance, ibRecords, students, invoices, incidents, coreRecords] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: termStart } },
      select: { date: true, status: true, student: { select: { id: true, classroom: { select: { gradeLevel: true } } } } },
    }),
    prisma.iBSubjectRecord.findMany({
      select: { currentGrade: true, predictedGrade: true, subjectGroup: true, level: true, critA: true, critB: true, critC: true, critD: true },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, curriculum: true, classroom: { select: { gradeLevel: true } } },
    }),
    prisma.feeInvoice.findMany({ select: { title: true, amount: true, status: true } }),
    prisma.behaviorIncident.findMany({
      where: { date: { gte: termStart } },
      select: { type: true, student: { select: { classroom: { select: { gradeLevel: true } } } } },
    }),
    prisma.iBCoreRecord.findMany({ select: { element: true, grade: true } }),
  ]);

  /* ------------------------------------------------------------ attendance */

  const dayBuckets = new Map<string, { present: number; total: number; at: Date }>();
  const groupBuckets = new Map<number, { present: number; total: number }>();
  const weekdayBuckets = new Map<number, { present: number; total: number }>();
  const perStudent = new Map<string, { present: number; total: number }>();

  for (const a of attendance) {
    const key = a.date.toISOString().slice(0, 10);
    const d = dayBuckets.get(key) ?? { present: 0, total: 0, at: a.date };
    d.total++; if (a.status === "PRESENT") d.present++;
    dayBuckets.set(key, d);

    const wd = weekdayBuckets.get(a.date.getUTCDay()) ?? { present: 0, total: 0 };
    wd.total++; if (a.status === "PRESENT") wd.present++;
    weekdayBuckets.set(a.date.getUTCDay(), wd);

    const g = a.student.classroom?.gradeLevel;
    if (g != null) {
      const gb = groupBuckets.get(g) ?? { present: 0, total: 0 };
      gb.total++; if (a.status === "PRESENT") gb.present++;
      groupBuckets.set(g, gb);
    }

    const ps = perStudent.get(a.student.id) ?? { present: 0, total: 0 };
    ps.total++; if (a.status === "PRESENT") ps.present++;
    perStudent.set(a.student.id, ps);
  }

  const attendanceByDay = [...dayBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      // Formatted here, in a Server Component. Client components must never
      // call toLocale* on a date — ICU drift between Node and the browser is a
      // hydration mismatch. See src/lib/dates.ts.
      day: new Date(key).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }),
      rate: pct(v.present, v.total) ?? 0,
    }));

  const attendanceByYearGroup = [...groupBuckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([g, v]) => ({ group: `Yr ${g}`, rate: pct(v.present, v.total) ?? 0 }));

  const attendanceByWeekday = [1, 2, 3, 4, 5]
    .filter((d) => weekdayBuckets.has(d))
    .map((d) => {
      const v = weekdayBuckets.get(d)!;
      return { day: WEEKDAYS[d], rate: pct(v.present, v.total) ?? 0 };
    });

  const termRate = pct(attendance.filter((a) => a.status === "PRESENT").length, attendance.length);

  /** Chronic absence: the outliers, as bands rather than a list of names. */
  const bands = { chronic: 0, watch: 0, fine: 0 };
  for (const v of perStudent.values()) {
    const r = pct(v.present, v.total) ?? 100;
    if (r < 85) bands.chronic++; else if (r < 92) bands.watch++; else bands.fine++;
  }

  /* ------------------------------------------------------------------- IB */

  const gradeCounts = new Map<number, number>();
  const groupTotals = new Map<number, { sum: number; n: number }>();
  const crit = { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0] } as Record<string, [number, number]>;

  for (const r of ibRecords) {
    if (r.currentGrade != null) {
      gradeCounts.set(r.currentGrade, (gradeCounts.get(r.currentGrade) ?? 0) + 1);
      const gt = groupTotals.get(r.subjectGroup) ?? { sum: 0, n: 0 };
      gt.sum += r.currentGrade; gt.n++;
      groupTotals.set(r.subjectGroup, gt);
    }
    for (const [k, v] of [["A", r.critA], ["B", r.critB], ["C", r.critC], ["D", r.critD]] as const) {
      if (v != null) { crit[k][0] += v; crit[k][1]++; }
    }
  }

  const gradeDistribution = [1, 2, 3, 4, 5, 6, 7].map((g) => ({ grade: String(g), students: gradeCounts.get(g) ?? 0 }));
  const gradeBySubjectGroup = [...groupTotals.entries()].sort(([a], [b]) => a - b)
    .map(([g, v]) => ({ group: IB_GROUPS[g] ?? `Group ${g}`, average: Math.round((v.sum / v.n) * 10) / 10 }));
  const mypCriteria = (["A", "B", "C", "D"] as const)
    .filter((k) => crit[k][1] > 0)
    .map((k) => ({ criterion: `Criterion ${k}`, average: Math.round((crit[k][0] / crit[k][1]) * 10) / 10 }));

  const graded = ibRecords.filter((r) => r.currentGrade != null);
  const meanGrade = graded.length ? Math.round((graded.reduce((n, r) => n + r.currentGrade!, 0) / graded.length) * 10) / 10 : null;
  const atRisk = graded.filter((r) => r.currentGrade! <= 3).length;

  /* ----------------------------------------------------------------- fees */

  const yearOf = (title: string) => title.match(/AY (\d{4}-\d{2})/)?.[1] ?? "Other";
  const feeYears = new Map<string, { collected: number; outstanding: number }>();
  for (const i of invoices) {
    const y = yearOf(i.title);
    const b = feeYears.get(y) ?? { collected: 0, outstanding: 0 };
    if (i.status === "PAID") b.collected += i.amount; else b.outstanding += i.amount;
    feeYears.set(y, b);
  }
  const collectionByYear = [...feeYears.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([year, v]) => ({ year: `AY ${year}`, collected: Math.round(v.collected), outstanding: Math.round(v.outstanding) }));
  const current = collectionByYear[collectionByYear.length - 1];
  const currentRate = current ? pct(current.collected, current.collected + current.outstanding) : null;

  /* ------------------------------------------------------------ behaviour */

  const behaviourMap = new Map<number, { merits: number; demerits: number }>();
  for (const i of incidents) {
    const g = i.student.classroom?.gradeLevel;
    if (g == null) continue;
    const b = behaviourMap.get(g) ?? { merits: 0, demerits: 0 };
    if (i.type === "MERIT") b.merits++; else b.demerits++;
    behaviourMap.set(g, b);
  }
  const behaviourByYearGroup = [...behaviourMap.entries()].sort(([a], [b]) => a - b)
    .map(([g, v]) => ({ group: `Yr ${g}`, ...v }));

  /* --------------------------------------------------------------- cohort */

  const byProgramme = students.reduce<Record<string, number>>((m, s) => ((m[s.curriculum] = (m[s.curriculum] ?? 0) + 1), m), {});
  const cohort = Object.entries(byProgramme).sort().map(([k, v]) => `${k} ${v}`).join(" · ");
  const coreDone = coreRecords.filter((c) => c.grade && ["A", "B"].includes(c.grade)).length;

  const headline = [
    { label: "Enrolled", value: students.length, sub: cohort || "no cohort data", icon: Users, tone: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Attendance this term", value: termRate == null ? "—" : `${termRate}%`, sub: `${bands.chronic} below 85%`, icon: TrendingDown, tone: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "Mean IB grade", value: meanGrade ?? "—", sub: `${atRisk} subject entries at 3 or below`, icon: GraduationCap, tone: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
    isPrincipal
      ? { label: "TOK & EE at A/B", value: coreDone, sub: `of ${coreRecords.length} core records`, icon: Award, tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" }
      : { label: `Collected ${current?.year ?? ""}`, value: current ? lakh(current.collected) : "—", sub: currentRate == null ? "nothing billed yet" : `${currentRate}% of billed`, icon: IndianRupee, tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="School Analytics"
        description={`Patterns across ${term?.title ?? "the current term"} — attendance, IB attainment, collection and behaviour. For today's register, approvals and anything needing chasing, use Live Operations.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {headline.map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.tone}`}><s.icon size={17} /></div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {attendance.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <b>No attendance has been recorded since {term?.title ?? "term"} began.</b> The charts below are
            empty because there is nothing to plot — not because attendance was zero.
          </p>
        </div>
      ) : (
        <AnalyticsBoard
          attendanceByDay={attendanceByDay}
          attendanceByYearGroup={attendanceByYearGroup}
          attendanceByWeekday={attendanceByWeekday}
          gradeDistribution={gradeDistribution}
          gradeBySubjectGroup={gradeBySubjectGroup}
          mypCriteria={mypCriteria}
          collectionByYear={collectionByYear}
          behaviourByYearGroup={behaviourByYearGroup}
        />
      )}

      {/* Chronic absence, as bands. Naming the children would make this a queue,
          and a queue belongs on Live. */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Attendance risk, {students.length} students</h3>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">IB schools generally treat sustained attendance below 90% as a barrier to attainment.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: bands.chronic, label: "below 85%", note: "chronic — needs a plan", tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/30" },
            { n: bands.watch, label: "85–92%", note: "watch list", tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
            { n: bands.fine, label: "above 92%", note: "no concern", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
          ].map((b) => (
            <div key={b.label} className={`rounded-lg p-4 ${b.tone}`}>
              <p className="text-2xl font-black">{b.n}</p>
              <p className="text-xs font-semibold">{b.label}</p>
              <p className="text-[11px] opacity-70">{b.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
