/**
 * Fill the library, put a salary scale on the staff, and complete the campus.
 *
 *   node scripts/seed-school.mjs --dry-run   # print the plan, write nothing
 *   node scripts/seed-school.mjs             # write it
 *
 * Three of the "built but empty" modules from
 * EduSphere360_Build_And_Next_Steps.docx §6.2. Nothing here is a code change:
 * every screen involved already reads these tables and shows an empty state.
 *
 * Safe to run more than once, and it never overwrites a person's decision:
 *   - a book already in the catalogue is matched on title and author and left
 *     alone, so an edited copy count or category survives;
 *   - a teacher who already has a salary keeps it — the scale only fills nulls;
 *   - a campus field that has been filled in is not touched;
 *   - loans are topped up to a target, never duplicated, and never issued
 *     beyond the number of copies the library owns.
 *
 * What it deliberately does NOT do is run payroll. A payroll run records who
 * ran it (`PayrollRun.runById`) and is an administrative act with a person
 * behind it; a seed script should not forge one. Once salaries are set, the
 * office runs the cycle from /admin/finance/payroll and it computes for real,
 * reading unpaid leave from LeaveRequest.
 */
import { PrismaClient } from "@prisma/client";
import { BOOKS, CAMPUS, salaryFor } from "./school-data.mjs";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();
const inr = (n) => "₹" + n.toLocaleString("en-IN");

log(DRY ? "DRY RUN — nothing will be written.\n" : "Writing library, salaries and campus.\n");
function log(...a) { console.log(...a); }

/* --------------------------------------------------------------- library -- */

const existingBooks = await prisma.libraryBook.findMany({
  select: { id: true, title: true, author: true },
});
const bookKey = (title, author) => `${title.toLowerCase()}|${author.toLowerCase()}`;
const bookIdByKey = new Map(existingBooks.map((b) => [bookKey(b.title, b.author), b.id]));

let booksCreated = 0, booksKept = 0;
for (const [title, author, category, subjectName, copiesTotal] of BOOKS) {
  const key = bookKey(title, author);
  if (bookIdByKey.has(key)) { booksKept++; continue; }
  booksCreated++;
  if (!DRY) {
    const created = await prisma.libraryBook.create({
      data: { title, author, category, subjectName, copiesTotal },
    });
    bookIdByKey.set(key, created.id);
  } else {
    // A book being created in this run has no id yet, and on a dry run never
    // gets one — so stand in a placeholder, or the loan plan below would find
    // an empty catalogue and report that it is lending nothing.
    bookIdByKey.set(key, `dry:${key}`);
  }
}
log(`Books:     ${booksCreated} added, ${booksKept} already catalogued.`);

/* ----------------------------------------------------------------- loans -- */

/**
 * Enough circulation that the library looks like a library: a book on loan,
 * one overdue, a history of returns. Borrowers are drawn evenly across the
 * roll by registration number, so the same students are picked every run and
 * the loans do not all land on one class.
 */
const TARGET_ACTIVE = 45;
const TARGET_RETURNED = 35;

const [activeNow, returnedNow] = await Promise.all([
  prisma.bookLoan.count({ where: { status: "ACTIVE" } }),
  prisma.bookLoan.count({ where: { status: "RETURNED" } }),
]);

const borrowers = (
  await prisma.student.findMany({
    where: { isActive: true, userId: { not: null } },
    select: { userId: true },
    orderBy: { registrationNo: "asc" },
  })
).map((s) => s.userId);

const lendable = BOOKS
  .map(([title, author, , , copies]) => ({ id: bookIdByKey.get(bookKey(title, author)), copies, title }))
  .filter((b) => b.id);

const DAY = 24 * 60 * 60 * 1000;
const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);

let loansCreated = 0;
if (borrowers.length && lendable.length) {
  // Active loans first, then the returned history, so a partial previous run
  // tops up rather than starting over.
  const plan = [];
  for (let i = activeNow; i < TARGET_ACTIVE; i++) plan.push({ status: "ACTIVE", i });
  for (let i = returnedNow; i < TARGET_RETURNED; i++) plan.push({ status: "RETURNED", i: i + 1000 });

  // Never lend more copies of a title than the library owns.
  const outByBook = new Map(
    (await prisma.bookLoan.groupBy({ by: ["bookId"], where: { status: "ACTIVE" }, _count: { _all: true } }))
      .map((r) => [r.bookId, r._count._all]),
  );

  for (const { status, i } of plan) {
    const userId = borrowers[(i * 7) % borrowers.length];
    const book = lendable[i % lendable.length];
    if (status === "ACTIVE") {
      const out = outByBook.get(book.id) ?? 0;
      if (out >= book.copies) continue;
      outByBook.set(book.id, out + 1);
    }
    // Active loans borrowed over the last three weeks; a few run past their
    // due date on purpose, because a real library always has some overdue.
    const daysAgo = status === "ACTIVE" ? (i % 21) + 1 : 40 + (i % 60);
    const borrowedAt = new Date(midnight.getTime() - daysAgo * DAY);
    const dueDate = new Date(borrowedAt.getTime() + 14 * DAY);
    const returnedAt = status === "RETURNED"
      ? new Date(borrowedAt.getTime() + ((i % 16) + 2) * DAY)
      : null;

    loansCreated++;
    if (!DRY) {
      await prisma.bookLoan.create({
        data: { bookId: book.id, userId, borrowedAt, dueDate, returnedAt, status },
      });
    }
  }
}
log(`Loans:     ${loansCreated} issued (${activeNow} active + ${returnedNow} returned already on record).`);

/* -------------------------------------------------------------- salaries -- */

const teachers = await prisma.teacher.findMany({
  select: { id: true, baseSalary: true, yearsExperience: true, user: { select: { name: true, role: true } } },
});

let paidSet = 0, paidKept = 0, payrollTotal = 0;
for (const t of teachers) {
  if (t.baseSalary != null) { paidKept++; payrollTotal += t.baseSalary; continue; }
  const salary = salaryFor({ yearsExperience: t.yearsExperience, role: t.user.role });
  payrollTotal += salary;
  paidSet++;
  if (!DRY) await prisma.teacher.update({ where: { id: t.id }, data: { baseSalary: salary } });
}
log(`Salaries:  ${paidSet} set, ${paidKept} already on record. Monthly gross across ${teachers.length} staff: ${inr(payrollTotal)}.`);

/* ---------------------------------------------------------------- campus -- */

const school = await prisma.school.findUnique({ where: { campusCode: CAMPUS.campusCode } });
let campusFields = [];
if (!school) {
  log(`Campus:    no row with campusCode "${CAMPUS.campusCode}" — nothing to complete. Add the campus first.`);
} else {
  // Only fill blanks. Anything already entered is somebody's answer.
  const fill = {};
  for (const field of ["address", "phone", "email", "principalName"]) {
    if (school[field] == null || school[field] === "") fill[field] = CAMPUS[field];
  }
  campusFields = Object.keys(fill);
  if (campusFields.length && !DRY) await prisma.school.update({ where: { id: school.id }, data: fill });
  log(`Campus:    "${school.name}" — ${campusFields.length ? `filled ${campusFields.join(", ")}` : "already complete"}.`);
}

/* ---------------------------------------------------------------- report -- */

if (!DRY) {
  const [titles, copies, active, overdue, returned] = await Promise.all([
    prisma.libraryBook.count(),
    prisma.libraryBook.aggregate({ _sum: { copiesTotal: true } }),
    prisma.bookLoan.count({ where: { status: "ACTIVE" } }),
    prisma.bookLoan.count({ where: { status: "ACTIVE", dueDate: { lt: new Date() } } }),
    prisma.bookLoan.count({ where: { status: "RETURNED" } }),
  ]);
  log(`\n  Library:  ${titles} titles, ${copies._sum.copiesTotal} copies, ${active} on loan (${overdue} overdue), ${returned} returned.`);
  log(`  Payroll:  every teacher has a salary — the office can now run a cycle at /admin/finance/payroll.`);
} else {
  log("\nNothing was written. Re-run without --dry-run to apply.");
}

await prisma.$disconnect();
