/**
 * Fill the transport module with the school's real fleet.
 *
 *   node scripts/seed-transport.mjs --dry-run     # print the plan, write nothing
 *   node scripts/seed-transport.mjs               # write it
 *   node scripts/seed-transport.mjs --routes-only # fleet and stops only, no riders
 *
 * The transport screens were built and tested in August but have never held a
 * row, so /operations/transport and /parent/transport both render their empty
 * state. This loads eight routes, forty-one stops and a hundred-odd riders, and
 * gives every rider a Bengaluru address in the locality their stop serves.
 *
 * Safe to run more than once. Everything it writes is keyed on something
 * unique — route name, (route, sequence), student — so a second run reports
 * "already correct" rather than duplicating. More importantly it never
 * overwrites a decision a person made:
 *
 *   - a student already on a route is left exactly where the office put them,
 *     and their seat is counted against that route's capacity;
 *   - an address that is not the seeded "123 School Lane, City" placeholder is
 *     treated as real and left alone.
 *
 * So the office can correct something in the UI, re-run this, and keep the
 * correction. The one thing it does update in place is route metadata: edit a
 * driver's phone in transport-data.mjs, re-run, and the change lands.
 *
 * One thing it cannot know: a child with no transport row might never have had
 * one, or might have been taken off the bus this morning on purpose. Both look
 * identical in the database, and this script fills empty seats — so a plain
 * re-run would put that child back on. Use --routes-only once the riders are
 * settled; it updates the fleet and the stops and does not look at students at
 * all.
 */
import { PrismaClient } from "@prisma/client";
import { ROUTES, WALK_IN_AREAS, PLACEHOLDER_ADDRESS, addressFor } from "./transport-data.mjs";

const DRY = process.argv.includes("--dry-run");
const ROUTES_ONLY = process.argv.includes("--routes-only");
const prisma = new PrismaClient();

const log = (...a) => console.log(...a);
const rupeeless = (n) => String(n).padStart(3, " ");

log(DRY ? "DRY RUN — nothing will be written.\n" : "Writing transport data.\n");

/* ---------------------------------------------------------------- routes -- */

const routeIdByName = new Map();
let routesCreated = 0, routesUpdated = 0;

for (const r of ROUTES) {
  const existing = await prisma.transportRoute.findUnique({
    where: { name: r.name },
    select: { id: true, vehicleNumber: true, driverName: true, driverPhone: true, capacity: true },
  });

  const desired = {
    vehicleNumber: r.vehicleNumber,
    driverName: r.driverName,
    driverPhone: r.driverPhone,
    capacity: r.capacity,
  };

  if (!existing) {
    routesCreated++;
    if (!DRY) {
      const created = await prisma.transportRoute.create({ data: { name: r.name, ...desired } });
      routeIdByName.set(r.name, created.id);
    }
    log(`  + ${r.name}  ${r.vehicleNumber}  ${r.driverName}  ${r.capacity} seats`);
  } else {
    routeIdByName.set(r.name, existing.id);
    const drifted = Object.entries(desired).filter(([k, v]) => existing[k] !== v);
    if (drifted.length) {
      routesUpdated++;
      if (!DRY) await prisma.transportRoute.update({ where: { id: existing.id }, data: desired });
      log(`  ~ ${r.name}  updated ${drifted.map(([k]) => k).join(", ")}`);
    } else {
      log(`  = ${r.name}  already correct`);
    }
  }
}

/* ----------------------------------------------------------------- stops -- */

const stopIdByKey = new Map(); // "route name|stop name" -> id
let stopsCreated = 0, stopsUpdated = 0;

for (const r of ROUTES) {
  const routeId = routeIdByName.get(r.name);
  // On a dry run a brand-new route has no id, so there is nothing to compare against.
  const existing = routeId
    ? await prisma.transportStop.findMany({
        where: { routeId },
        select: { id: true, name: true, pickupTime: true, dropTime: true, sequence: true },
      })
    : [];
  const bySeq = new Map(existing.map((s) => [s.sequence, s]));

  for (const [i, s] of r.stops.entries()) {
    const sequence = i + 1;
    const desired = { name: s.name, pickupTime: s.pickupTime, dropTime: s.dropTime };
    const prev = bySeq.get(sequence);

    if (!prev) {
      stopsCreated++;
      if (!DRY) {
        const created = await prisma.transportStop.create({ data: { routeId, sequence, ...desired } });
        stopIdByKey.set(`${r.name}|${s.name}`, created.id);
      }
    } else {
      stopIdByKey.set(`${r.name}|${s.name}`, prev.id);
      const drifted = Object.entries(desired).some(([k, v]) => prev[k] !== v);
      if (drifted) {
        stopsUpdated++;
        if (!DRY) await prisma.transportStop.update({ where: { id: prev.id }, data: desired });
      }
    }
  }
}

log(`\nRoutes: ${routesCreated} added, ${routesUpdated} updated.`);
log(`Stops:  ${stopsCreated} added, ${stopsUpdated} updated.\n`);

/* ---------------------------------------------------------------- riders -- */

if (ROUTES_ONLY) {
  log("--routes-only: riders and addresses left untouched.");
  await prisma.$disconnect();
  process.exit(0);
}

/**
 * Every student, sorted by registration number so the selection is
 * reproducible.
 *
 * Addresses are fixed for all of them, riders are drawn only from the ones
 * still enrolled. The sixteen inactive students are graduated DP leavers with
 * Alumni records — they do not belong on a bus, but the placeholder address in
 * their record is just as wrong as anyone else's, and filtering them out of the
 * query entirely would have quietly left it there.
 */
const students = await prisma.student.findMany({
  select: {
    id: true, registrationNo: true, name: true, address: true, isActive: true,
    transport: { select: { routeId: true } },
  },
  orderBy: { registrationNo: "asc" },
});

const enrolled = students.filter((s) => s.isActive);
const TARGET = ROUTES.reduce((n, r) => n + r.riders, 0);

/**
 * Riders are picked evenly across the enrolled list rather than as the first N
 * — otherwise one bus would carry an entire cohort, since registration numbers
 * run in enrollment order.
 */
const riderIds = new Set();
enrolled.forEach((s, i) => {
  const takes = Math.floor(((i + 1) * TARGET) / enrolled.length) > Math.floor((i * TARGET) / enrolled.length);
  if (takes) riderIds.add(s.id);
});
log(`${students.length} students, ${enrolled.length} enrolled, ${riderIds.size} to be seated.\n`);

// Seats, dealt round-robin across the routes so every bus carries a mix of
// PYP, MYP and DP rather than one contiguous block of registration numbers.
const seats = [];
const remaining = ROUTES.map((r) => r.riders);
while (remaining.some((n) => n > 0)) {
  for (const [ri, r] of ROUTES.entries()) {
    if (remaining[ri] > 0) { seats.push(r); remaining[ri]--; }
  }
}

/**
 * A seat already taken by someone the office assigned by hand is not on offer.
 *
 * Keyed by route NAME, not id. A route being created in this run has no id yet
 * — and on a dry run it never gets one — so keying by id silently collapsed all
 * eight routes onto a single `undefined` counter, and every route after the
 * first appeared full.
 */
const nameByRouteId = new Map([...routeIdByName].map(([name, id]) => [id, name]));
const takenPerRoute = new Map();
for (const s of students) {
  const name = nameByRouteId.get(s.transport?.routeId);
  if (name) takenPerRoute.set(name, (takenPerRoute.get(name) ?? 0) + 1);
}

const perRouteStopCursor = new Map();
let ridersCreated = 0, ridersKept = 0, addressesSet = 0, addressesKept = 0, overCapacity = 0;
let seatCursor = 0;

for (const [i, s] of students.entries()) {
  let place = WALK_IN_AREAS[i % WALK_IN_AREAS.length];

  if (s.transport) {
    ridersKept++;                       // already on a route — leave it alone
  } else if (riderIds.has(s.id) && seatCursor < seats.length) {
    const route = seats[seatCursor++];
    const routeId = routeIdByName.get(route.name);
    const stopIdx = (perRouteStopCursor.get(route.name) ?? 0) % route.stops.length;
    perRouteStopCursor.set(route.name, stopIdx + 1);
    const stop = route.stops[stopIdx];
    place = stop;                        // address should match the bus stop

    const used = (takenPerRoute.get(route.name) ?? 0);
    if (used >= route.capacity) {
      overCapacity++;
      // Report the first few by name; past that a list of eighty is not useful.
      if (overCapacity <= 5) log(`  ! ${route.name} is full — ${s.name} left off.`);
      else if (overCapacity === 6) log("  ! (further full-route warnings suppressed)");
    } else {
      takenPerRoute.set(route.name, used + 1);
      ridersCreated++;
      if (!DRY) {
        await prisma.studentTransport.create({
          data: { studentId: s.id, routeId, stopId: stopIdByKey.get(`${route.name}|${stop.name}`) ?? null },
        });
      }
    }
  }

  const replaceable = !s.address || PLACEHOLDER_ADDRESS.test(s.address);
  if (replaceable) {
    addressesSet++;
    if (!DRY) {
      await prisma.student.update({ where: { id: s.id }, data: { address: addressFor(place, i) } });
    }
  } else {
    addressesKept++;
  }
}

log(`Riders:    ${ridersCreated} assigned, ${ridersKept} already assigned and left alone.`);
log(`Addresses: ${addressesSet} placeholder addresses replaced, ${addressesKept} real ones kept.`);
if (overCapacity) log(`WARNING:   ${overCapacity} students could not be seated — a route is full.`);

/* ---------------------------------------------------------------- report -- */

if (!DRY) {
  log("\nOccupancy now:");
  const rows = await prisma.transportRoute.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true, vehicleNumber: true, driverName: true, capacity: true,
      _count: { select: { riders: true, stops: true } },
    },
  });
  for (const r of rows) {
    const pct = Math.round((r._count.riders / r.capacity) * 100);
    log(`  ${r.name.padEnd(38)} ${r.vehicleNumber}  ${rupeeless(r._count.riders)}/${rupeeless(r.capacity)} seats (${String(pct).padStart(3)}%)  ${r._count.stops} stops`);
  }
  const total = rows.reduce((n, r) => n + r._count.riders, 0);
  log(`\n  ${total} riders across ${rows.length} routes.`);
} else {
  log("\nNothing was written. Re-run without --dry-run to apply.");
}

await prisma.$disconnect();
