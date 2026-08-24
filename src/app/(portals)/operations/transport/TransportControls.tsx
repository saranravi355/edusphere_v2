"use client";

import { useState } from "react";
import { Plus, MapPin, UserPlus } from "lucide-react";
import FormModal from "@/components/ui/FormModal";
import { createRoute, addStop, assignRider } from "./actions";

const field =
  "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 " +
  "text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
const secondary =
  "px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm " +
  "font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2";

export default function TransportControls({
  routes,
  students,
}: {
  routes: { id: string; name: string; stops: { id: string; name: string }[] }[];
  students: { id: string; name: string; classroom: string }[];
}) {
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const stops = routes.find((r) => r.id === routeId)?.stops ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      <FormModal
        title="Assign a student to a route"
        description="Moves them if they are already on one."
        buttonText="Assign rider"
        buttonIcon={<UserPlus size={16} aria-hidden />}
        buttonClassName={secondary}
        submitLabel="Assign"
        pendingLabel="Assigning…"
        action={assignRider}
      >
        <div>
          <label className={label} htmlFor="tr-student">Student</label>
          <select id="tr-student" name="studentId" required defaultValue="" className={field}>
            <option value="" disabled>Select a student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.classroom}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="tr-route">Route</label>
          <select
            id="tr-route"
            name="routeId"
            required
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className={field}
          >
            {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="tr-stop">Stop (optional)</label>
          <select key={routeId} id="tr-stop" name="stopId" defaultValue="" className={field}>
            <option value="">Not set</option>
            {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {stops.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">That route has no stops yet.</p>
          )}
        </div>
      </FormModal>

      <FormModal
        title="Add a stop"
        description="Stops are ordered as you add them."
        buttonText="Add stop"
        buttonIcon={<MapPin size={16} aria-hidden />}
        buttonClassName={secondary}
        submitLabel="Add stop"
        pendingLabel="Adding…"
        action={addStop}
      >
        <div>
          <label className={label} htmlFor="ts-route">Route</label>
          <select id="ts-route" name="routeId" required defaultValue={routes[0]?.id ?? ""} className={field}>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ts-name">Stop name</label>
          <input id="ts-name" name="name" required type="text" placeholder="e.g. Jayanagar 4th Block" className={field} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="ts-pickup">Pickup time</label>
            <input id="ts-pickup" name="pickupTime" required type="time" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="ts-drop">Drop time (optional)</label>
            <input id="ts-drop" name="dropTime" type="time" className={field} />
          </div>
        </div>
      </FormModal>

      <FormModal
        title="Add a route"
        buttonText="New route"
        buttonIcon={<Plus size={16} aria-hidden />}
        submitLabel="Add route"
        pendingLabel="Adding…"
        action={createRoute}
      >
        <div>
          <label className={label} htmlFor="rt-name">Route name</label>
          <input id="rt-name" name="name" required type="text" placeholder="e.g. Route 4 — Whitefield" className={field} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="rt-vehicle">Vehicle number</label>
            <input id="rt-vehicle" name="vehicleNumber" required type="text" placeholder="e.g. KA-01-AB-1234" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="rt-capacity">Seats</label>
            <input id="rt-capacity" name="capacity" type="number" min={1} max={100} defaultValue={40} className={field} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="rt-driver">Driver</label>
            <input id="rt-driver" name="driverName" required type="text" placeholder="e.g. Mahesh Kumar" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="rt-phone">Driver phone</label>
            <input id="rt-phone" name="driverPhone" type="tel" placeholder="+91…" className={field} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
