/**
 * Bring the school's data up to the term it is actually in.
 *
 *   node scripts/seed-current-term.mjs --dry-run   # report, write nothing
 *   node scripts/seed-current-term.mjs             # write it
 *
 * WHY THIS EXISTS
 *
 * The modules each invented their own calendar, and nothing reconciled them:
 *
 *   - AcademicEvent says Term 1 runs 3 Aug - 18 Dec 2026. That is the year the
 *     school is in.
 *   - Attendance stops on 10 July 2026, three weeks BEFORE that term started,
 *     plus two stray rows on 18 August. So /admin/live computed its headline
 *     attendance from two rows and reported 100%.
 *   - Every fee invoice belongs to AY 2025-26 (due dates Jun-Dec 2025, payments
 *     Jun-Sep 2025). The finance module describes last year while the academic
 *     module describes this one, so any page showing both mixes two academic
 *     years - and /admin/analytics, filtering on the CALENDAR year, matched no
 *     payments at all and reported YTD revenue of zero.
 *
 * This fills the current term: attendance for every school day since Term 1
 * began, and the AY 2026-27 fee cycle that should have been raised in August.
 * AY 2025-26 is left untouched, so year-on-year comparison still works.
 *
 * Safe to run more than again. Attendance has NO unique constraint on
 * (studentId, date) - only on id - so duplicates are prevented here by reading
 * what already exists and skipping those pairs. Invoices are matched on
 * (student, title). Nothing existing is modified.
 */
import { PrismaClient } from "@prisma/client";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();
const log = (...a) => console.log(...a);
const inr = (n) => "Rs " + Math.round(n).toLocaleString("en-IN");
const iso = (d) => d.toISOString().slice(0, 10);
const dayKey = (studentId, d) => `${studentId}|${iso(d)}`;

/** Today, at UTC midnight, so a re-run on the same day is a no-op. */
const TODAY = new Date(); TODAY.setUTCHours(0, 0, 0, 0);

log(DRY ? "DRY RUN - nothing will be written.\n" : "Filling the current term.\n");

/* ------------------------------------------------------------ the term -- */

const term = await prisma.academicEvent.findFirst({
  where: { type: "TERM", startDate: { lte: TODAY }, endDate: { gte: TODAY } },
  orderBy: { startDate: "desc" },
});
if (!term) {
  log("No TERM in AcademicEvent covers today. Add the term dates first - this");
  log("script derives everything from the school's own calendar rather than");
  log("guessing when the year starts.");
  await prisma.$disconnect();
  process.exit(1);
}
const termStart = new Date(term.startDate); termStart.setUTCHours(0, 0, 0, 0);
log(`Term: ${term.title}  ${iso(termStart)} -> ${iso(term.endDate)}  (today ${iso(TODAY)})`);

/** School days: weekdays from the start of term to today inclusive. */
const schoolDays = [];
for (let d = new Date(termStart); d <= TODAY; d.setUTCDate(d.getUTCDate() + 1)) {
  const dow = d.getUTCDay();
  if (dow !== 0 && dow !== 6) schoolDays.push(new Date(d));
}
log(`School days so far this term: ${schoolDays.length}\n`);

/* ---------------------------------------------------------- attendance -- */

const students = await prisma.student.findMany({
  where: { isActive: true },
  select: { id: true, registrationNo: true },
  orderBy: { registrationNo: "asc" },
});

const recorder = (await prisma.attendance.findFirst({ select: { recordedBy: true } }))?.recordedBy
  ?? (await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } }))?.id;

const already = new Set(
  (await prisma.attendance.findMany({
    where: { date: { gte: termStart, lte: TODAY } },
    select: { studentId: true, date: true },
  })).map((a) => dayKey(a.studentId, a.date)),
);

/**
 * Each child gets their own attendance habit, fixed by their position on the
 * roll, so the same student is reliably the same student on a second run - and
 * so a handful of them are genuinely poor attenders. Without that spread there
 * is no such thing as chronic absence to report on.
 */
function propensity(i) {
  if (i % 23 === 0) return 0.75;      // ~7 students: persistent absence
  if (i % 11 === 0) return 0.86;      // ~14 students: patchy
  return 0.93 + (i % 5) * 0.008;      // everyone else: 93-96%
}
// Tuned so the term lands near the 92.6% present / 4.3% absent / 3.1% late
// the school already recorded in June and July. A seeded term that is
// noticeably healthier than the real one would flatter every chart on
// /admin/analytics.

const rows = [];
for (const [i, s] of students.entries()) {
  const p = propensity(i);
  for (const [j, d] of schoolDays.entries()) {
    if (already.has(dayKey(s.id, d))) continue;
    // Deterministic pseudo-random, stable across runs.
    const r = ((i * 7919 + j * 104729) % 1000) / 1000;
    let status = "PRESENT", isMedicalLeave = false;
    if (r > p) {
      const which = ((i * 31 + j * 17) % 100) / 100;
      if (which < 0.42) { status = "LATE"; }
      else { status = "ABSENT"; isMedicalLeave = which < 0.71; }
    }
    rows.push({ studentId: s.id, date: new Date(d), status, session: "FULL_DAY", isMedicalLeave, recordedBy: recorder });
  }
}

const summary = rows.reduce((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});
log(`Attendance: ${rows.length} rows to add across ${students.length} students`);
log(`  present ${summary.PRESENT ?? 0} - absent ${summary.ABSENT ?? 0} - late ${summary.LATE ?? 0}`);
log(`  ${already.size} rows already recorded in this range were left alone.`);

if (!DRY && rows.length) {
  for (let i = 0; i < rows.length; i += 500) {
    await prisma.attendance.createMany({ data: rows.slice(i, i + 500) });
  }
}

/* ----------------------------------------------------------------- fees -- */

/**
 * The AY 2025-26 cycle was three terms billed 40/30/30 against an annual
 * tuition. This raises the same shape for AY 2026-27, per student, at the
 * programme they are actually in now - which changed when the cohort defect
 * was fixed, so billing anyone off the old curriculum field would have been
 * wrong.
 */
const AY = "2026-27";
const TERMS = [
  { n: 1, due: new Date(Date.UTC(2026, 7, 14)), share: 0.40 },
  { n: 2, due: new Date(Date.UTC(2026, 10, 14)), share: 0.30 },
  { n: 3, due: new Date(Date.UTC(2027, 1, 14)), share: 0.30 },
];

const structures = await prisma.feeStructure.findMany();
const annualFor = (programme) => {
  const row = structures.find((s) => s.name.toUpperCase().startsWith(programme));
  return row?.amount ?? (programme === "DP" ? 340000 : 285000);
};

const billable = await prisma.student.findMany({
  where: { isActive: true },
  select: { id: true, registrationNo: true, curriculum: true },
  orderBy: { registrationNo: "asc" },
});

const existingTitles = new Set(
  (await prisma.feeInvoice.findMany({
    where: { title: { contains: AY } },
    select: { studentId: true, title: true },
  })).map((i) => `${i.studentId}|${i.title}`),
);

const invoices = [];
for (const [i, s] of billable.entries()) {
  const annual = annualFor(s.curriculum);
  for (const t of TERMS) {
    const title = `Term ${t.n} · Tuition & Fees (AY ${AY})`;
    if (existingTitles.has(`${s.id}|${title}`)) continue;
    const amount = Math.round((annual * t.share) / 500) * 500;
    // Only a term already due can be paid or overdue. About one family in
    // seven is late on the term that has fallen due.
    let status = "PENDING", paidAt = null;
    if (t.due <= TODAY) {
      const late = (i * 13) % 7 === 0;
      status = late ? "OVERDUE" : "PAID";
      if (!late) paidAt = new Date(t.due.getTime() - ((i * 3) % 25) * 86400000);
    }
    invoices.push({ studentId: s.id, title, amount, dueDate: t.due, status, paidAt, idx: i });
  }
}

const paidCount = invoices.filter((i) => i.status === "PAID").length;
const billed = invoices.reduce((n, i) => n + i.amount, 0);
log(`\nFees AY ${AY}: ${invoices.length} invoices to raise for ${billable.length} students`);
log(`  ${inr(billed)} billed - ${paidCount} already settled, ${invoices.filter((i) => i.status === "OVERDUE").length} overdue, ${invoices.filter((i) => i.status === "PENDING").length} not yet due`);

if (!DRY) {
  if (!structures.some((s) => s.academicYear === "2026-2027")) {
    await prisma.feeStructure.createMany({
      data: [
        { name: "MYP Annual Tuition", amount: annualFor("MYP"), academicYear: "2026-2027" },
        { name: "DP Annual Tuition", amount: annualFor("DP"), academicYear: "2026-2027" },
      ],
    });
  }
  for (const inv of invoices) {
    const { idx, ...data } = inv;
    const created = await prisma.feeInvoice.create({ data });
    if (created.status === "PAID") {
      await prisma.paymentTransaction.create({
        data: {
          invoiceId: created.id, amount: created.amount,
          method: idx % 3 === 0 ? "CARD" : "UPI", status: "SUCCESS",
          createdAt: created.paidAt ?? created.dueDate,
        },
      });
    }
  }
}

/* --------------------------------------------------------------- report -- */

if (!DRY) {
  const [att, attTerm, present, inv2627, collected] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { date: { gte: termStart, lte: TODAY } } }),
    prisma.attendance.count({ where: { date: { gte: termStart, lte: TODAY }, status: "PRESENT" } }),
    prisma.feeInvoice.count({ where: { title: { contains: AY } } }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true }, where: { title: { contains: AY }, status: "PAID" } }),
  ]);
  log(`\n  Attendance: ${att} rows total, ${attTerm} this term, ${Math.round((present / attTerm) * 100)}% present.`);
  log(`  Fees:       ${inv2627} invoices for AY ${AY}, ${inr(collected._sum.amount ?? 0)} collected so far.`);
} else {
  log("\nNothing was written. Re-run without --dry-run to apply.");
}

await prisma.$disconnect();
