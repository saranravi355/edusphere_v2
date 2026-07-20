import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50 dark:bg-zinc-950">
      <p className="text-5xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Page not found</h1>
      <p className="text-sm text-slate-500 mt-2">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
