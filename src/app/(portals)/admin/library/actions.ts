"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard, ADMIN_ROLES, STAFF_ROLES } from "@/lib/authz";
import type { ActionState } from "@/components/ui/form";
import { BOOK_CATEGORIES, LOAN_DAYS } from "@/lib/options";

/**
 * The library catalogue.
 *
 * Earlier in this project the admin library screen was replaced with an honest
 * "not built yet" notice, because it had been a 1.5-second setTimeout "barcode
 * scanner" that always returned The Principia Mathematica, two invented
 * checkout rows and an invented ₹15 fine, with no Book model anywhere in the
 * schema. This is the module that notice pointed forward to.
 */
export async function addBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(ADMIN_ROLES);
  if (!auth.ok) return { error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const isbn = String(formData.get("isbn") ?? "").trim();
  const category = String(formData.get("category") ?? "GENERAL");
  const subjectName = String(formData.get("subjectName") ?? "").trim();
  const copiesTotal = Number(formData.get("copiesTotal") ?? 1);

  if (!title) return { error: "Give the book a title." };
  if (!author) return { error: "Name the author." };
  if (!(BOOK_CATEGORIES as readonly string[]).includes(category)) return { error: "Choose a category." };
  if (!Number.isInteger(copiesTotal) || copiesTotal < 1 || copiesTotal > 500) {
    return { error: "Copies must be a whole number between 1 and 500." };
  }

  if (isbn) {
    const clash = await prisma.libraryBook.findUnique({ where: { isbn }, select: { title: true } });
    if (clash) return { error: `ISBN ${isbn} is already catalogued as “${clash.title}”.` };
  }

  await prisma.libraryBook.create({
    data: { title, author, isbn: isbn || null, category, subjectName: subjectName || null, copiesTotal },
  });

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: `${title} catalogued (${copiesTotal} cop${copiesTotal === 1 ? "y" : "ies"}).` };
}

/** Lend a copy. Refuses when every copy is already out. */
export async function issueBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  const bookId = String(formData.get("bookId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!bookId) return { error: "Choose a book." };
  if (!userId) return { error: "Choose the borrower." };

  const [book, borrower] = await Promise.all([
    prisma.libraryBook.findUnique({
      where: { id: bookId },
      select: { title: true, copiesTotal: true, _count: { select: { loans: { where: { status: "ACTIVE" } } } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  if (!book) return { error: "That book is not in the catalogue." };
  if (!borrower) return { error: "That person no longer has an account." };
  if (book._count.loans >= book.copiesTotal) {
    return { error: `All ${book.copiesTotal} cop${book.copiesTotal === 1 ? "y is" : "ies are"} out.` };
  }

  const already = await prisma.bookLoan.findFirst({
    where: { bookId, userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (already) return { error: `${borrower.name} already has a copy of that.` };

  const dueDate = new Date(Date.now() + LOAN_DAYS * 86_400_000);
  await prisma.$transaction([
    prisma.bookLoan.create({ data: { bookId, userId, dueDate, status: "ACTIVE" } }),
    prisma.notification.create({
      data: {
        userId,
        title: "Library book issued",
        message: `${book.title} — due back ${dueDate.toISOString().slice(0, 10)}.`,
        type: "INFO",
      },
    }),
  ]);

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: `${book.title} issued to ${borrower.name}, due in ${LOAN_DAYS} days.` };
}

/** Take a copy back. */
export async function returnBook(loanId: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  const loan = await prisma.bookLoan.findUnique({ where: { id: loanId }, select: { status: true } });
  if (!loan) return { error: "That loan no longer exists." };
  if (loan.status !== "ACTIVE") return { error: "That copy has already been returned." };

  await prisma.bookLoan.update({
    where: { id: loanId },
    data: { status: "RETURNED", returnedAt: new Date() },
  });

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  return { success: true };
}

/* ------------------------------------------------------------- scanning -- */

/**
 * Resolve one scanned code to a book or a borrower.
 *
 * Worth being precise about what "scanning" means here, because this screen
 * used to carry a fake one. Almost every barcode scanner a school buys is a
 * keyboard-wedge device: it types the digits it reads and presses Enter,
 * exactly as if someone had typed them fast. So a focused text input IS a
 * working scanner for that hardware — there is no camera, no image decoding
 * and no library involved, and nothing here is simulated. Point a ₹1,500 USB
 * scanner at a barcode and this resolves it.
 *
 * Camera scanning, from a phone or a webcam, is a different problem and is not
 * built. The panel says so rather than pretending.
 *
 * What a code can be:
 *   - a book's ISBN, or its catalogue id if the school prints its own labels
 *   - a student's registration number, which is what goes on a student ID card
 *   - a staff member's email, for teachers borrowing
 */
export type ScanHit =
  | { kind: "book"; id: string; label: string; detail: string; available: number }
  | { kind: "borrower"; id: string; label: string; detail: string }
  | { kind: "none"; code: string };

export async function resolveScanCode(raw: string): Promise<ScanHit> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { kind: "none", code: raw };

  const code = raw.trim();
  if (!code) return { kind: "none", code };

  const book = await prisma.libraryBook.findFirst({
    where: { OR: [{ isbn: code }, { id: code }] },
    select: {
      id: true, title: true, author: true, copiesTotal: true,
      _count: { select: { loans: { where: { status: "ACTIVE" } } } },
    },
  });
  if (book) {
    return {
      kind: "book", id: book.id, label: book.title,
      detail: book.author,
      available: book.copiesTotal - book._count.loans,
    };
  }

  const student = await prisma.student.findFirst({
    where: { registrationNo: code, isActive: true, userId: { not: null } },
    select: { userId: true, name: true, registrationNo: true, classroom: { select: { name: true } } },
  });
  if (student?.userId) {
    return {
      kind: "borrower", id: student.userId, label: student.name,
      detail: `${student.registrationNo}${student.classroom ? ` · ${student.classroom.name}` : ""}`,
    };
  }

  const staff = await prisma.user.findFirst({
    where: { email: code, role: { in: ["CLASS_TEACHER", "SUBJECT_TEACHER", "PRINCIPAL", "SUPER_ADMIN"] } },
    select: { id: true, name: true, role: true },
  });
  if (staff) {
    return {
      kind: "borrower", id: staff.id, label: staff.name,
      detail: staff.role.replace("_", " ").toLowerCase(),
    };
  }

  return { kind: "none", code };
}

/**
 * Issue a book from two scans. Deliberately delegates every rule to
 * issueBook() rather than restating them, so the counter and the form can
 * never drift apart on what counts as a valid loan.
 */
export async function issueByScan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(STAFF_ROLES);
  if (!auth.ok) return { error: auth.error };

  const bookCode = String(formData.get("bookCode") ?? "").trim();
  const borrowerCode = String(formData.get("borrowerCode") ?? "").trim();
  if (!bookCode) return { error: "Scan or type the book's code." };
  if (!borrowerCode) return { error: "Scan or type the borrower's ID." };

  const [book, borrower] = await Promise.all([
    resolveScanCode(bookCode),
    resolveScanCode(borrowerCode),
  ]);

  if (book.kind !== "book") return { error: `No book matches “${bookCode}”.` };
  if (borrower.kind !== "borrower") return { error: `No student or staff member matches “${borrowerCode}”.` };

  const forward = new FormData();
  forward.set("bookId", book.id);
  forward.set("userId", borrower.id);
  return issueBook(_prev, forward);
}
