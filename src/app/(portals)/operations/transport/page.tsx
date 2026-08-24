import PageHeader from "@/components/ui/PageHeader";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canAccessDepartment } from "@/lib/operations";
import { redirect } from "next/navigation";
import ExportButton from "@/components/data/ExportButton";
import TransportControls from "./TransportControls";
import { removeRider, setRouteActive } from "./actions";
import { ConfirmIconButton, SubmitButton } from "@/components/ui/form";
import { Bus, Users, MapPin, UserMinus, Info } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Transport.
 *
 * Everything here was invented — see actions.ts. Routes, drivers, vehicles,
 * stops and who rides on which are real records now. What this page no longer
 * claims is live vehicle position: there is no tracker feeding the system, so
 * nothing pretends to know where a bus is.
 */
export default async function TransportPage() {
  const session = await getSession();
  if (!canAccessDepartment(session?.user?.role, "transport")) redirect("/");

  const [routes, students] = await Promise.all([
    prisma.transportRoute.findMany({
      orderBy: { name: "asc" },
      include: {
        stops: { orderBy: { sequence: "asc" } },
        riders: {
          include: {
            student: { select: { id: true, name: true, classroom: { select: { name: true } } } },
            stop: { select: { name: true } },
          },
        },
      },
    }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, name: true, classroom: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeRoutes = routes.filter((r) => r.isActive);
  const riderCount = routes.reduce((n, r) => n + r.riders.length, 0);
  const seatCount = activeRoutes.reduce((n, r) => n + r.capacity, 0);

  const exportRows = routes.flatMap((r) =>
    r.riders.map((rd) => ({
      Route: r.name,
      Vehicle: r.vehicleNumber,
      Driver: r.driverName,
      Student: rd.student.name,
      Class: rd.student.classroom?.name ?? "Unassigned",
      Stop: rd.stop?.name ?? "Not set",
    })),
  );

  const stats = [
    { label: "Routes in service", value: `${activeRoutes.length} of ${routes.length}`, icon: Bus },
    { label: "Students on transport", value: riderCount, icon: Users },
    { label: "Seats free", value: Math.max(0, seatCount - riderCount), icon: MapPin },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader
        title="Transport"
        description="Bus routes, stops, drivers and who rides on which."
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <TransportControls
              routes={routes.map((r) => ({ id: r.id, name: r.name, stops: r.stops.map((s) => ({ id: s.id, name: s.name })) }))}
              students={students.map((s) => ({ id: s.id, name: s.name, classroom: s.classroom?.name ?? "Unassigned" }))}
            />
            <ExportButton rows={exportRows} filename="transport-riders" label="Export riders" />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
              <s.icon size={20} aria-hidden />
            </div>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        No vehicle tracker is connected, so this module does not show live positions. It used to animate one.
      </p>

      {routes.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center text-slate-500">
          No routes yet. Add one with &ldquo;New route&rdquo;.
        </div>
      )}

      <div className="space-y-6">
        {routes.map((r) => (
          <div key={r.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Bus size={18} className="text-blue-500" aria-hidden /> {r.name}
                  {!r.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">Out of service</span>}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {r.vehicleNumber} · {r.driverName}{r.driverPhone ? ` · ${r.driverPhone}` : ""} ·{" "}
                  {r.riders.length}/{r.capacity} seats taken
                </p>
              </div>
              <form action={async () => { "use server"; await setRouteActive(r.id, !r.isActive); }}>
                <SubmitButton size="sm" variant="subtle" pendingText="Updating…">
                  {r.isActive ? "Take out of service" : "Return to service"}
                </SubmitButton>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
              <div className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Stops</h4>
                {r.stops.length === 0 ? (
                  <p className="text-sm text-slate-400">No stops yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {r.stops.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] flex items-center justify-center">{s.sequence}</span>
                          {s.name}
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {s.pickupTime}{s.dropTime ? ` · ${s.dropTime}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Riders ({r.riders.length})</h4>
                {r.riders.length === 0 ? (
                  <p className="text-sm text-slate-400">Nobody assigned yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {r.riders.map((rd) => (
                      <li key={rd.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-700 dark:text-slate-300">
                          {rd.student.name}
                          <span className="text-xs text-slate-400"> · {rd.student.classroom?.name ?? "Unassigned"}{rd.stop ? ` · ${rd.stop.name}` : ""}</span>
                        </span>
                        <ConfirmIconButton
                          onConfirm={async () => { "use server"; return removeRider(rd.student.id); }}
                          question="Take them off this route?"
                          confirmLabel="Remove"
                          triggerLabel={`Remove ${rd.student.name} from ${r.name}`}
                          triggerClassName="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <UserMinus size={14} aria-hidden />
                        </ConfirmIconButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
