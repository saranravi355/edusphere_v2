import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function PortalNotFound() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5">
        <Compass size={26} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Page not found</h2>
      <p className="text-sm text-slate-500 mt-2">
        This page doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft size={15} /> Back to my dashboard
      </Link>
    </div>
  );
}
