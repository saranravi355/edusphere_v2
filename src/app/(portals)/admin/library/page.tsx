import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExportButton from "@/components/data/ExportButton";
import LibraryControls from "./LibraryControls";
import { returnBook } from "./actions";
import { ConfirmIconButton } from "@/components/ui/form";
import { Book, BookUp, Clock, Search, Undo2, Boxes, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Library.
 *
 * The original page was invented end to end: a setTimeout "barcode scanner"
 * that always resolved to "The Principia Mathematica (ID: LIB-1049)", two
 * made-up checkout rows and a made-up ₹15 overdue fine, with no Book model in
 * the schema for any of it to touch. It was replaced with an honest "not built
 * yet" notice. This is the module that notice pointed forward to: a real
 * catalogue, real loans and real due dates.
 */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  const sp = await searchParams;
  const query = (sp.q ?? "").trim();

  const [books, allBooks, loans, people, assetCount] = await Promise.all([
    prisma.libraryBook.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { author: { contains: query, mode: "insensitive" } },
              { subjectName: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      include: { _count: { select: { loans: { where: { status: "ACTIVE" } } } } },
      orderBy: { title: "asc" },
    }),
    prisma.libraryBook.findMany({
      include: { _count: { select: { loans: { where: { status: "ACTIVE" } } } } },
      orderBy: { title: "asc" },
    }),
    prisma.bookLoan.findMany({
      where: { status: "ACTIVE" },
      include: { book: { select: { title: true } }, user: { select: { name: true, role: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["STUDENT", "CLASS_TEACHER", "SUBJECT_TEACHER"] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.asset.count(),
  ]);

  const totalCopies = allBooks.reduce((n, b) => n + b.copiesTotal, 0);
  const now = new Date();
  const overdue = loans.filter((l) => l.dueDate < now).length;

  const exportRows = books.map((b) => ({
    Title: b.title, Author: b.author, Category: b.category, Subject: b.subjectName ?? "",
    ISBN: b.isbn ?? "", Copies: b.copiesTotal, Out: b._count.loans,
  }));

  const stats = [
    { label: "Titles catalogued", value: allBooks.length, icon: Book },
    { label: "Copies on loan", value: `${loans.length} of ${totalCopies}`, icon: BookUp },
    { label: "Overdue", value: overdue, icon: Clock },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Library"
        description="Catalogue, loans and due dates."
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <LibraryControls
              lendable={allBooks
                .filter((b) => b._count.loans < b.copiesTotal)
                .map((b) => ({ id: b.id, title: b.title, free: b.copiesTotal - b._count.loans }))}
              people={people}
            />
            <ExportButton rows={exportRows} filename="library-catalogue" label="Export catalogue" />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
              <s.icon size={20} aria-hidden />
            </div>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <form className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[12rem] max-w-sm">
            <label className="sr-only" htmlFor="lib-search">Search the catalogue</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} aria-hidden />
            <input
              id="lib-search" name="q" type="search" defaultValue={query}
              placeholder="Title, author or subject…"
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-black text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button type="submit" className="px-3 py-2 text-sm font-medium rounded-md bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
            Search
          </button>
          {query && <Link href="/admin/library" className="text-sm text-slate-500 hover:underline">Clear</Link>}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-900/30 text-slate-500">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Title</th>
                <th className="text-left font-medium px-5 py-2.5">Author</th>
                <th className="text-left font-medium px-5 py-2.5">Category</th>
                <th className="text-right font-medium px-5 py-2.5">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {books.map((b) => {
                const free = b.copiesTotal - b._count.loans;
                return (
                  <tr key={b.id}>
                    <td className="px-5 py-2.5 text-slate-800 dark:text-slate-200">
                      {b.title}
                      {b.subjectName && <span className="block text-xs text-slate-400">{b.subjectName}</span>}
                    </td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-slate-400">{b.author}</td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-slate-400">{b.category.replace("_", " ").toLowerCase()}</td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${free === 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {free} / {b.copiesTotal}
                    </td>
                  </tr>
                );
              })}
              {books.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    {query
                      ? <>Nothing matches that. <Link href="/admin/library" className="text-blue-600 hover:underline">Clear the search</Link></>
                      : "The catalogue is empty. Use “Add book” to start it."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">On loan ({loans.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-900/30 text-slate-500">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Book</th>
                <th className="text-left font-medium px-5 py-2.5">Borrower</th>
                <th className="text-left font-medium px-5 py-2.5">Due</th>
                <th className="text-right font-medium px-5 py-2.5">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loans.map((l) => {
                const late = l.dueDate < now;
                return (
                  <tr key={l.id}>
                    <td className="px-5 py-2.5 text-slate-800 dark:text-slate-200">{l.book.title}</td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-slate-400">
                      {l.user.name}
                      <span className="block text-xs text-slate-400">{l.user.role.replace("_", " ").toLowerCase()}</span>
                    </td>
                    <td className={`px-5 py-2.5 ${late ? "text-rose-600 dark:text-rose-400 font-medium" : "text-slate-600 dark:text-slate-400"}`}>
                      {formatDate(l.dueDate, "dMonYy")}{late ? " · overdue" : ""}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <ConfirmIconButton
                        onConfirm={async () => { "use server"; return returnBook(l.id); }}
                        question="Mark returned?"
                        confirmLabel="Returned"
                        triggerLabel={`Mark ${l.book.title} returned`}
                        triggerClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >
                        <Undo2 size={13} aria-hidden /> Return
                      </ConfirmIconButton>
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Nothing is out at the moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Boxes size={14} aria-hidden />
        Laptops, projectors and lab equipment are tracked separately —{" "}
        <Link href="/admin/assets" className="text-blue-600 hover:underline inline-flex items-center gap-1">
          {assetCount} assets <ArrowRight size={11} aria-hidden />
        </Link>
      </p>
    </div>
  );
}
