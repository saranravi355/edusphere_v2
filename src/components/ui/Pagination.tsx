import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Server-rendered pagination. Takes the current search params so that a filter
 * and a page number survive each other — changing pages keeps the search, and
 * the resulting URL is shareable and survives a refresh.
 *
 * Renders nothing when everything fits on one page.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params = {},
  label = "results",
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  /** Other query params to preserve, e.g. { q: "sharma", class: "MYP1A" }. */
  params?: Record<string, string | undefined>;
  label?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const link = "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors";
  const disabled = "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md opacity-30 cursor-not-allowed";

  return (
    <nav aria-label="Pagination" className="flex flex-wrap justify-between items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
      <p aria-live="polite">
        {total === 0 ? `No ${label}` : `${from}–${to} of ${total} ${label}`}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className={link}>
              <ChevronLeft size={14} aria-hidden /> Previous
            </Link>
          ) : (
            <span className={disabled} aria-hidden><ChevronLeft size={14} /> Previous</span>
          )}
          <span className="px-3 tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={href(page + 1)} rel="next" className={link}>
              Next <ChevronRight size={14} aria-hidden />
            </Link>
          ) : (
            <span className={disabled} aria-hidden>Next <ChevronRight size={14} /></span>
          )}
        </div>
      )}
    </nav>
  );
}
