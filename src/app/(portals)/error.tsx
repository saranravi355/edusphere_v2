"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Client error boundary for all portal routes — replaces the raw Next.js
// error screen with a branded, reassuring message and a retry action.
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle size={26} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        This page hit an unexpected error. Try again — if it keeps happening,
        let your school&apos;s IT team know and share the reference below.
      </p>
      {error?.digest && (
        <p className="text-[11px] text-slate-400 mt-2 font-mono">Ref: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
      >
        <RotateCcw size={15} /> Try again
      </button>
    </div>
  );
}
