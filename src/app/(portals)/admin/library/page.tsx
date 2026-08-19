import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Book, Info, ArrowRight, Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * The library module has no data model behind it.
 *
 * This page previously presented a complete, working-looking library: a barcode
 * scanner that was a 1.5s setTimeout resolving to a hardcoded
 * "The Principia Mathematica (ID: LIB-1049)", three invented checkout rows
 * (LIB-8021, LIB-3055) and an invented ₹15 overdue fine. None of it touched the
 * database, and there is no Book or Loan model in the schema for it to touch.
 *
 * Rather than keep a convincing fake in front of school staff, the page now says
 * what is true. Equipment lending IS implemented — Asset / AssetCheckout — so it
 * points there, which is the closest real capability.
 *
 * To build this properly: add Book and BookLoan models (ISBN, copies, borrower,
 * due date, fine accrual), migrate, then reuse the Assets checkout flow.
 */
export default async function LibraryManagement() {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "PRINCIPAL"].includes(session.user.role)) redirect("/");

  // Equipment lending is real, so show its actual numbers rather than inventing any.
  const [assetCount, activeCheckouts] = await Promise.all([
    prisma.asset.count(),
    prisma.assetCheckout.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Library System"
        description="Book cataloguing and lending is not yet implemented."
      />

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <Book className="w-5 h-5 text-slate-400" aria-hidden />
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              Not built yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              There is no book catalogue in the database — no titles, copies, borrowers or
              fines. Building it needs <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Book</code> and{" "}
              <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">BookLoan</code> models
              and a migration, after which the existing checkout flow can be reused.
            </p>
            <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
              This screen used to show a working-looking scanner and checkout list. All of it
              was invented in the browser and saved nothing, so it has been removed rather
              than left to mislead.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
          <Boxes size={18} className="text-emerald-500" aria-hidden />
          Equipment lending does work
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {assetCount} tracked {assetCount === 1 ? "asset" : "assets"}, {activeCheckouts} currently
          checked out. Laptops, projectors and lab equipment are handled there today.
        </p>
        <Link
          href="/admin/assets"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-800"
        >
          Go to Assets <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
