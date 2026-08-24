"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/authz";
import { rolesForDepartment } from "@/lib/operations";

/** Administrators, plus the transport manager who actually runs the buses. */
const TRANSPORT = rolesForDepartment("transport");
import type { ActionState } from "@/components/ui/form";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Create a bus route.
 *
 * /operations/transport reported "24 of 26 vehicles active", 24 drivers, one alert
 * and three named routes with ETAs — all a literal array inside the page — and
 * its "Track" button was a bare <button> in a Server Component with no handler.
 * /parent/transport/live animated a bus along a CSS road, counting an ETA down
 * from a hardcoded 12 minutes, and named a driver and a vehicle that do not
 * exist. There was no transport model of any kind.
 */
export async function createRoute(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TRANSPORT);
  if (!auth.ok) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const vehicleNumber = String(formData.get("vehicleNumber") ?? "").trim();
  const driverName = String(formData.get("driverName") ?? "").trim();
  const driverPhone = String(formData.get("driverPhone") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 40);

  if (!name) return { error: "Name the route." };
  if (!vehicleNumber) return { error: "Give the vehicle registration." };
  if (!driverName) return { error: "Name the driver." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) return { error: "Capacity must be between 1 and 100." };

  const clash = await prisma.transportRoute.findUnique({ where: { name }, select: { id: true } });
  if (clash) return { error: `There is already a route called “${name}”.` };

  await prisma.transportRoute.create({
    data: { name, vehicleNumber, driverName, driverPhone: driverPhone || null, capacity },
  });
  revalidatePath("/operations/transport");
  return { success: `${name} added.` };
}

/** Add a stop to a route. */
export async function addStop(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TRANSPORT);
  if (!auth.ok) return { error: auth.error };

  const routeId = String(formData.get("routeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const pickupTime = String(formData.get("pickupTime") ?? "").trim();
  const dropTime = String(formData.get("dropTime") ?? "").trim();

  if (!routeId) return { error: "Choose a route." };
  if (!name) return { error: "Name the stop." };
  if (!HHMM.test(pickupTime)) return { error: "Pickup time must look like 07:15." };
  if (dropTime && !HHMM.test(dropTime)) return { error: "Drop time must look like 15:40." };

  const route = await prisma.transportRoute.findUnique({
    where: { id: routeId },
    select: { name: true, stops: { select: { sequence: true }, orderBy: { sequence: "desc" }, take: 1 } },
  });
  if (!route) return { error: "That route no longer exists." };

  await prisma.transportStop.create({
    data: {
      routeId, name, pickupTime, dropTime: dropTime || null,
      sequence: (route.stops[0]?.sequence ?? 0) + 1,
    },
  });
  revalidatePath("/operations/transport");
  return { success: `${name} added to ${route.name}.` };
}

/** Put a student on a route, or move them. */
export async function assignRider(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await guard(TRANSPORT);
  if (!auth.ok) return { error: auth.error };

  const studentId = String(formData.get("studentId") ?? "");
  const routeId = String(formData.get("routeId") ?? "");
  const stopId = String(formData.get("stopId") ?? "").trim();

  if (!studentId) return { error: "Choose a student." };
  if (!routeId) return { error: "Choose a route." };

  const [student, route] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { name: true } }),
    prisma.transportRoute.findUnique({
      where: { id: routeId },
      select: { name: true, capacity: true, _count: { select: { riders: true } } },
    }),
  ]);
  if (!student) return { error: "That student no longer exists." };
  if (!route) return { error: "That route no longer exists." };

  const alreadyOnThisRoute = await prisma.studentTransport.findUnique({
    where: { studentId }, select: { routeId: true },
  });
  if (!alreadyOnThisRoute || alreadyOnThisRoute.routeId !== routeId) {
    if (route._count.riders >= route.capacity) {
      return { error: `${route.name} is full (${route.capacity} seats).` };
    }
  }

  if (stopId) {
    const stop = await prisma.transportStop.findUnique({ where: { id: stopId }, select: { routeId: true } });
    if (!stop || stop.routeId !== routeId) return { error: "That stop is not on that route." };
  }

  await prisma.studentTransport.upsert({
    where: { studentId },
    create: { studentId, routeId, stopId: stopId || null },
    update: { routeId, stopId: stopId || null },
  });

  revalidatePath("/operations/transport");
  revalidatePath("/parent/transport");
  return { success: `${student.name} is on ${route.name}.` };
}

/** Take a student off transport. */
export async function removeRider(studentId: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TRANSPORT);
  if (!auth.ok) return { error: auth.error };

  const row = await prisma.studentTransport.findUnique({ where: { studentId }, select: { id: true } });
  if (!row) return { error: "That student is not on a route." };

  await prisma.studentTransport.delete({ where: { studentId } });
  revalidatePath("/operations/transport");
  revalidatePath("/parent/transport");
  return { success: true };
}

/** Take a route out of service without losing its history. */
export async function setRouteActive(routeId: string, isActive: boolean): Promise<{ error?: string; success?: boolean }> {
  const auth = await guard(TRANSPORT);
  if (!auth.ok) return { error: auth.error };
  await prisma.transportRoute.update({ where: { id: routeId }, data: { isActive } });
  revalidatePath("/operations/transport");
  revalidatePath("/parent/transport");
  return { success: true };
}
