import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Bus, MapPin, Phone, Info } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Transport, for a parent.
 *
 * This was a card promising "Real-time GPS tracking and ETA", linking to a page
 * that animated a bus down a CSS road, counted an ETA down from a hardcoded 12
 * minutes with setInterval, and named a driver ("Mark Peterson") and a vehicle
 * ("BUS-402") that do not exist, beside a phone button with no tel: link.
 *
 * No tracker is fitted to this school's buses. What the school does know —
 * which route the child is on, which stop, when the bus is due there, and how
 * to reach the driver — is real, and that is what this shows.
 */
export default async function ParentTransportPage() {
  const session = await getSession();
  if (!session || session.user.role !== "PARENT") redirect("/");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    select: {
      students: {
        select: {
          id: true,
          name: true,
          transport: {
            select: {
              stop: { select: { name: true, pickupTime: true, dropTime: true } },
              route: {
                select: {
                  name: true, vehicleNumber: true, driverName: true, driverPhone: true, isActive: true,
                  stops: {
                    orderBy: { sequence: "asc" },
                    select: { id: true, name: true, pickupTime: true, sequence: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!parent) redirect("/parent");

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <PageHeader title="Transport" description="Your child's bus route, stop and pickup time." />

      {parent.students.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          No children are linked to your account yet.
        </div>
      )}

      {parent.students.map((child) => {
        const t = child.transport;
        return (
          <div key={child.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{child.name}</h3>
            </div>

            {!t ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {child.name} is not on a school bus route. Contact the office to arrange transport.
              </div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                      <Bus size={20} aria-hidden />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{t.route.name}</p>
                      <p className="text-sm text-slate-500">
                        {t.route.vehicleNumber} · {t.route.driverName}
                        {!t.route.isActive && " · currently out of service"}
                      </p>
                    </div>
                  </div>
                  {t.route.driverPhone && (
                    <a
                      href={`tel:${t.route.driverPhone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Phone size={14} aria-hidden /> Call the driver
                    </a>
                  )}
                </div>

                {t.stop && (
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin size={15} className="text-emerald-600" aria-hidden /> Stop: <strong>{t.stop.name}</strong>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                      Pickup {t.stop.pickupTime}{t.stop.dropTime ? ` · Drop ${t.stop.dropTime}` : ""}
                    </p>
                  </div>
                )}

                {t.route.stops.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Route</h4>
                    <ol className="space-y-2">
                      {t.route.stops.map((s) => {
                        const mine = s.name === t.stop?.name;
                        return (
                          <li
                            key={s.id}
                            className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${mine ? "bg-blue-50 dark:bg-blue-900/20 font-medium text-blue-800 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[10px] flex items-center justify-center">
                                {s.sequence}
                              </span>
                              {s.name}{mine ? " — your stop" : ""}
                            </span>
                            <span className="tabular-nums text-xs">{s.pickupTime}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        The school&apos;s buses have no tracker fitted, so live positions are not available. This page previously
        showed a simulated one.
      </p>
    </div>
  );
}
