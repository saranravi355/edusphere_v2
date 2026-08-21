import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Search, Clock, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const COVERS = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-teal-500", "bg-rose-500", "bg-emerald-500"];
/** Stable per-title colour, so a book keeps the same spine between visits. */
function coverFor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[n % COVERS.length];
}

/**
 * Library.
 *
 * This page listed four books — "Advanced Mathematics vol 2, 12 MB",
 * "Physics: Principles & Problems, 45 MB" and two more — from a literal array,
 * above a search box with no handler, an "All Subjects" filter with no handler,
 * and a download button on each card with no onClick and no href. Nothing here
 * was queried and nothing could be downloaded.
 *
 * It reads the catalogue now, the search works, and it shows the student what
 * they actually have out and when it is due back.
 */
export default async function StudentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const sp = await searchParams;
  const query = (sp.q ?? "").trim();

  const categories = (
    await prisma.libraryBook.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } })
  ).map((c) => c.category);
  const category = sp.category && categories.includes(sp.category) ? sp.category : "";

  const [books, myLoans] = await Promise.all([
    prisma.libraryBook.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { author: { contains: query, mode: "insensitive" as const } },
                { subjectName: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { loans: { where: { status: "ACTIVE" } } } } },
      orderBy: { title: "asc" },
    }),
    prisma.bookLoan.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { book: { select: { title: true, author: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader
        title="Library"
        description="What the school library holds, and what you have out."
      />

      {myLoans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">You have {myLoans.length} book{myLoans.length === 1 ? "" : "s"} out</h3>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {myLoans.map((l) => {
              const late = l.dueDate < now;
              return (
                <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-800 dark:text-slate-200">
                    {l.book.title}
                    <span className="block text-xs text-slate-400">{l.book.author}</span>
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs ${late ? "text-rose-600 dark:text-rose-400 font-medium" : "text-slate-500"}`}>
                    <Clock size={13} aria-hidden /> due {formatDate(l.dueDate, "dMonYy")}{late ? " · overdue" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/*
        The search box and the subject filter had no handler at all. They are one
        GET form now, so a filtered shelf survives a refresh and can be shared.
      */}
      <form className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-96">
          <label className="sr-only" htmlFor="lib-q">Search the library</label>
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" aria-hidden />
          <input
            id="lib-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, author or subject…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="sr-only" htmlFor="lib-cat">Category</label>
          <select
            id="lib-cat"
            name="category"
            defaultValue={category}
            className="flex-1 md:flex-none py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c.replace("_", " ").toLowerCase()}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700">
            Search
          </button>
          {(query || category) && (
            <Link href="/student/library" className="text-sm text-slate-500 hover:underline">Clear</Link>
          )}
        </div>
      </form>

      {books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center text-slate-500">
          {query || category
            ? <>Nothing matches that. <Link href="/student/library" className="text-blue-600 hover:underline">Clear the filters</Link></>
            : "The library catalogue is empty."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((b) => {
            const free = b.copiesTotal - b._count.loans;
            return (
              <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className={`${coverFor(b.id)} h-32 flex items-center justify-center`}>
                  <BookOpen className="text-white/80" size={36} aria-hidden />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{b.author}</p>
                  {b.subjectName && <p className="text-xs text-slate-400 mt-0.5">{b.subjectName}</p>}
                  <p className={`text-xs mt-auto pt-3 flex items-center gap-1.5 ${free > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    <CheckCircle2 size={12} aria-hidden />
                    {free > 0 ? `${free} of ${b.copiesTotal} on the shelf` : "All copies out"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Borrowing is done at the library desk — ask a librarian and the loan appears here.
      </p>
    </div>
  );
}
