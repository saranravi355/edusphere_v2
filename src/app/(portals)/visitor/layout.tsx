import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { VISITOR_PORTAL_ROLES } from "@/lib/visiting";

/**
 * Deliberately not AppShell. The visiting team gets one page, so a collapsible
 * sidebar of areas they cannot open would be a menu of locked doors.
 */
export default async function VisitorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !VISITOR_PORTAL_ROLES.includes(session.user.role)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">EduSphere 360</p>
          <h1 className="font-bold text-slate-800 dark:text-slate-100">IB Evidence — Visiting Team</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
