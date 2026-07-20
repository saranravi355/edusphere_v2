// Route-level loading skeleton shown while any portal page's server data loads.
export default function Loading() {
  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100 dark:bg-zinc-800/70" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6"
          >
            <div className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-zinc-800 mb-4" />
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-1/2 bg-slate-100 dark:bg-zinc-800/70 rounded" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" />
    </div>
  );
}
