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
