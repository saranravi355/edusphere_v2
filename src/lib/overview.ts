import prisma from "@/lib/prisma";
import { schoolDay } from "@/lib/dates";

/**
 * Shared definitions for the three Overview screens.
 *
 * Dashboard, Live Operations and School Analytics each answer a different
 * question, but they answer it from the same database at the same moment, and
 * every time one of them computed a window or a threshold for itself the three
 * ended up disagreeing in public. The register that reported 100% attendance
 * for a school of 157 because two children were marked; the ₹0 revenue on
 * Analytics beside a healthy figure on Live; "today" meaning the server's
 * midnight on one page and the school's on another. Those were all the same
 * bug wearing different clothes: a definition written twice.
 *
 * So the definitions live here once, and each page decides only how to draw
 * them. The division of labour between the three, stated so it survives the
 * next edit:
 *
 *   Dashboard  — the front door. Counts and doors. Never a list of names.
 *   Live Ops   — today's work. Queues and exceptions. Never a time axis.
 *   Analytics  — the shape of the term. Trends and distributions. Never a queue.
 */

/**
 * The term the school is actually in, from its own calendar.
 *
 * Not the calendar year. Filtering fees "year to date" from 1 January is what
 * made Analytics report ₹0 revenue for months: every payment on file belonged
 * to the previous academic year, so it matched nothing.
 */
export async function currentTerm(now: Date = new Date()) {
  return prisma.academicEvent.findFirst({
    where: { type: "TERM", startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });
}

export interface OpenItem {
  n: number;
  label: string;
  href: string;
  tone: "rose" | "amber";
}

export interface OpenCounts {
  registersNotTaken: number;
  pendingLeave: number;
  overdueInvoices: number;
  overdueInvoiceTotal: number;
  overdueBooks: number;
}

/**
 * Everything with somebody waiting at the other end of it, counted properly.
 *
 * "Properly" is the point. Live Operations used to derive these badges from the
 * lists it had already fetched for display — and those lists carry `take: 6`,
 * so the page reported "6 library books overdue" when there were thirty-six,
 * and would have said "6 leave requests" whether there were six or sixty. The
 * number was silently the page size. Counts come from count()/aggregate() here;
 * a page that also wants to show the rows fetches its own capped list for that.
 *
 * Arrears older than this term are deliberately excluded. Without that boundary
 * the fee queue reads "198 invoices past due", of which about 175 are a year
 * old, which buries the seventeen families who have actually missed a payment
 * this term.
 */
export async function openCounts(now: Date = new Date()): Promise<OpenCounts> {
  const { start: dayStart, end: dayEnd } = schoolDay(now);
  const term = await currentTerm(now);
  const termStart = term ? new Date(term.startDate) : new Date(now.getFullYear(), 0, 1);

  const [pendingLeave, overdueInvoices, overdueBooks, classrooms, todayAttendance] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.feeInvoice.aggregate({
      _count: true,
      _sum: { amount: true },
      where: { status: { in: ["OVERDUE", "PENDING"] }, dueDate: { lt: now, gte: termStart } },
    }),
    prisma.bookLoan.count({ where: { status: "ACTIVE", dueDate: { lt: now } } }),
    prisma.classroom.findMany({ select: { id: true, _count: { select: { students: true } } } }),
    prisma.attendance.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { student: { select: { classroomId: true } } },
    }),
  ]);

  const marked = new Set(todayAttendance.map((a) => a.student.classroomId).filter(Boolean));
  // A class with no students on the roll cannot have an outstanding register.
  const registersNotTaken = classrooms.filter((c) => c._count.students > 0 && !marked.has(c.id)).length;

  return {
    registersNotTaken,
    pendingLeave,
    overdueInvoices: overdueInvoices._count,
    overdueInvoiceTotal: Math.round(overdueInvoices._sum.amount ?? 0),
    overdueBooks,
  };
}

/**
 * The same strip of cards both Overview pages draw, with the settled ones
 * dropped. Presentation only — the numbers are already decided.
 *
 * Every card is a link, so a card a given role cannot open is worse than no
 * card: it looks like a door, and middleware turns them round at it. Fees are
 * management's, not the Principal's — their sidebar has no Finance section and
 * /admin/finance is closed to them — so the invoice card is theirs alone. It is
 * dropped rather than shown unlinked because there is nothing a Principal can
 * do about an overdue invoice anyway.
 */
export function waitingItems(c: OpenCounts, role?: string | null): OpenItem[] {
  const canOpenFinance = role === "SUPER_ADMIN";
  return (
    [
      { n: c.registersNotTaken, label: "classes have not had a register taken today", href: "/admin/live#register", tone: "rose" },
      { n: c.pendingLeave, label: "leave requests awaiting a decision", href: "/admin/staff/leave", tone: "amber" },
      canOpenFinance
        ? {
            n: c.overdueInvoices,
            label: `invoices overdue this term · ₹${c.overdueInvoiceTotal.toLocaleString("en-IN")}`,
            href: "/admin/finance/invoices",
            tone: "rose",
          }
        : null,
      { n: c.overdueBooks, label: "library books overdue", href: "/admin/library", tone: "amber" },
    ].filter((q): q is OpenItem => q !== null)
  ).filter((q) => q.n > 0);
}

/**
 * Today's register, as the three states that actually matter.
 *
 * `rate` is null when nothing has been marked at all. That distinction is the
 * whole point: a dashboard that cannot tell "nobody was marked absent" from
 * "nobody was marked" is worse than no dashboard, because it is confidently
 * wrong — it renders an empty register as 0.0% and a school of 157 as though
 * not one child turned up.
 */
export async function todayRegister(now: Date = new Date()) {
  const { start, end } = schoolDay(now);
  const rows = await prisma.attendance.findMany({
    where: { date: { gte: start, lt: end } },
    select: { status: true },
  });
  if (rows.length === 0) return { marked: 0, present: 0, rate: null as number | null };
  const present = rows.filter((r) => r.status === "PRESENT").length;
  return { marked: rows.length, present, rate: Math.round((present / rows.length) * 1000) / 10 };
}
