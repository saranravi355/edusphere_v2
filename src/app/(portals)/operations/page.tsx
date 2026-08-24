import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { DEPARTMENTS, departmentForRole } from "@/lib/operations";
import { UtensilsCrossed, Bus, Bed, Monitor, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, LucideIcon> = {
  canteen: UtensilsCrossed,
  transport: Bus,
  hostel: Bed,
  resources: Monitor,
  assets: Package,
};

/**
 * The operations hub.
 *
 * A department manager never sees this: they are sent straight to the one
 * department they run, because a landing page offering four doors they cannot
 * open is worse than no landing page. Administrators get the overview, with a
 * real count against each department rather than a decorative number.
 */
export default async function OperationsPage() {
  const session = await getSession();
  const role: string = session?.user?.role;

  const own = departmentForRole(role);
  if (own) redirect(`/operations/${own.slug}`);

  const [menuItems, routes, riders, occupants, resources, assets, assetsOut] = await Promise.all([
    prisma.menuItem.count(),
    prisma.transportRoute.count(),
    prisma.studentTransport.count(),
    prisma.hostelStudent.count(),
    prisma.resource.count(),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "CHECKED_OUT" } }),
  ]);

  const summary: Record<string, string> = {
    canteen: `${menuItems} dish${menuItems === 1 ? "" : "es"} on the menu`,
    transport: `${routes} route${routes === 1 ? "" : "s"} · ${riders} rider${riders === 1 ? "" : "s"}`,
    hostel: `${occupants} student${occupants === 1 ? "" : "s"} resident`,
    resources: `${resources} bookable`,
    assets: `${assets} registered · ${assetsOut} out`,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Canteen, transport, hostel, resources and assets. Each has its own manager and its own login."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d) => {
          const Icon = ICONS[d.slug] ?? Package;
          return (
            <Link
              key={d.slug}
              href={`/operations/${d.slug}`}
              className="group rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2 text-blue-600 dark:text-blue-400">
                  <Icon size={20} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {d.label}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{d.blurb}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{summary[d.slug]}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        You are seeing all five because you are an administrator. Each manager signs in and lands
        in their own department, and cannot reach the other four.
      </p>
    </div>
  );
}
