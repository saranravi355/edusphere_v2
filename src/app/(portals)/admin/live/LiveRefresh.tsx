"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function LiveRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLastUpdated(new Date()), 0);
    const id = setInterval(() => {
      router.refresh();
      setLastUpdated(new Date());
    }, intervalSeconds * 1000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [router, intervalSeconds]);

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        LIVE
      </span>
      <button
        onClick={() => { router.refresh(); setLastUpdated(new Date()); }}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <RefreshCw size={12} />
        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Refreshing…"}
        <span className="text-slate-400">· auto every {intervalSeconds}s</span>
      </button>
    </div>
  );
}
