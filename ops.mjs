/**
 * Operations portal: does each manager get exactly one department, and nothing else?
 *
 * Route guards and layouts are only half the question. A Server Action is an
 * independently addressable endpoint — knowing its id is enough to invoke it
 * with any session — so this drives the real UI to prove a manager CAN write to
 * their own department, then checks every other department is refused at the
 * route level too.
 */
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://127.0.0.1:4970";
const PASSWORD = "password123";

const DEPTS = ["canteen", "transport", "hostel", "resources", "assets"];
const MANAGERS = [
  { email: "canteen@edusphere.com", dept: "canteen", role: "CANTEEN_MANAGER" },
  { email: "transport@edusphere.com", dept: "transport", role: "TRANSPORT_MANAGER" },
  { email: "hostel@edusphere.com", dept: "hostel", role: "HOSTEL_MANAGER" },
  { email: "resources@edusphere.com", dept: "resources", role: "RESOURCES_MANAGER" },
  { email: "assets@edusphere.com", dept: "assets", role: "ASSETS_MANAGER" },
];

let pass = 0, fail = 0;
const ok = (cond, name, detail = "") => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

async function signIn(email) {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await pg.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pg.fill('input[type="email"]', email);
  await pg.fill('input[type="password"]', PASSWORD);
  await pg.click('button[type="submit"]');
  await pg.waitForTimeout(3500);
  return { ctx, pg };
}

/* ---------------------------------------------------- 1. landing + isolation */
console.log("\n== Each manager lands in their own department ==\n");
for (const m of MANAGERS) {
  const { ctx, pg } = await signIn(m.email);
  const landed = new URL(pg.url()).pathname;
  ok(landed === `/operations/${m.dept}`, `${m.dept}: signs in and lands on their own page`, landed);

  // every other department must be refused
  const leaked = [];
  for (const other of DEPTS.filter((d) => d !== m.dept)) {
    await pg.goto(`${BASE}/operations/${other}`, { waitUntil: "networkidle" });
    if (new URL(pg.url()).pathname === `/operations/${other}`) leaked.push(other);
  }
  ok(leaked.length === 0, `${m.dept}: the other four departments are refused`, leaked.length ? "LEAKED " + leaked.join(",") : "4/4 refused");

  // and the admin portal is refused
  await pg.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  ok(!new URL(pg.url()).pathname.startsWith("/admin"), `${m.dept}: cannot reach /admin`, new URL(pg.url()).pathname);

  // and other portals
  await pg.goto(`${BASE}/teacher`, { waitUntil: "networkidle" });
  const t = new URL(pg.url()).pathname;
  await pg.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
  const p = new URL(pg.url()).pathname;
  ok(!t.startsWith("/teacher") && !p.startsWith("/parent"), `${m.dept}: cannot reach the teacher or parent portals`, `${t} / ${p}`);

  // the sidebar offers only their own department
  await pg.goto(`${BASE}/operations/${m.dept}`, { waitUntil: "networkidle" });
  const opsLinks = await pg.locator('a[href^="/operations/"]').evaluateAll((els) =>
    [...new Set(els.map((e) => e.getAttribute("href")))]
  );
  const foreign = opsLinks.filter((h) => DEPTS.some((d) => d !== m.dept && h.startsWith(`/operations/${d}`)));
  ok(foreign.length === 0, `${m.dept}: the sidebar shows no other department`, foreign.length ? foreign.join(",") : "clean");

  await ctx.close();
}

/* ------------------------------------------------------- 2. they can work */
console.log("\n== Each manager can actually do their job ==\n");

// canteen — add a dish, read it back out of the database
{
  const { ctx, pg } = await signIn("canteen@edusphere.com");
  const dish = `QA Ops Dish ${Date.now().toString(36)}`;
  await pg.goto(`${BASE}/operations/canteen`, { waitUntil: "networkidle" });
  await pg.fill('input[name="name"]', dish);
  await pg.click('button[type="submit"]:has-text("Add")');
  await pg.waitForTimeout(2500);
  const row = await prisma.menuItem.findFirst({ where: { name: dish } });
  ok(!!row, "canteen manager writes a MenuItem", row ? `saved id ${row.id.slice(0, 8)}` : "nothing in the database");
  if (row) await prisma.menuItem.delete({ where: { id: row.id } });
  await ctx.close();
}

// transport — create a route through the real modal
{
  const { ctx, pg } = await signIn("transport@edusphere.com");
  const rname = `QA Ops Route ${Date.now().toString(36)}`;
  await pg.goto(`${BASE}/operations/transport`, { waitUntil: "networkidle" });
  await pg.click('button:has-text("New route")');
  await pg.waitForTimeout(600);
  const dlg = pg.locator('[role="dialog"]');
  await dlg.locator('input[name="name"]').fill(rname);
  await dlg.locator('input[name="vehicleNumber"]').fill("KA-01-OPS-1");
  await dlg.locator('input[name="driverName"]').fill("QA Ops Driver");
  await dlg.locator('input[name="driverPhone"]').fill("9000000001");
  await dlg.locator('button[type="submit"]').click();
  await pg.waitForTimeout(2500);
  const route = await prisma.transportRoute.findFirst({ where: { name: rname } });
  ok(!!route, "transport manager writes a TransportRoute", route ? route.vehicleNo : "nothing in the database");
  if (route) await prisma.transportRoute.delete({ where: { id: route.id } });
  await ctx.close();
}

// assets — register a device
{
  const { ctx, pg } = await signIn("assets@edusphere.com");
  const serial = `QA-OPS-${Date.now().toString(36)}`;
  await pg.goto(`${BASE}/operations/assets`, { waitUntil: "networkidle" });
  await pg.click('button:has-text("New asset")');
  await pg.waitForTimeout(600);
  const dlg = pg.locator('[role="dialog"]');
  await dlg.locator('input[name="name"]').fill("QA Ops Laptop");
  await dlg.locator('input[name="serialNo"]').fill(serial);
  await dlg.locator('button[type="submit"]').click();
  await pg.waitForTimeout(2500);
  const asset = await prisma.asset.findFirst({ where: { serialNo: serial } });
  ok(!!asset, "assets manager writes an Asset", asset ? asset.status : "nothing in the database");
  if (asset) await prisma.asset.delete({ where: { id: asset.id } });
  await ctx.close();
}

/* --------------------------------------- 3. nobody else gets into the portal */
console.log("\n== Everyone else is kept out of /operations ==\n");
for (const [email, who] of [
  ["meena.k@edusphere.com", "teacher"],
  ["aarav.p@edusphere.com", "student"],
  ["rahul.p@edusphere.com", "parent"],
]) {
  const { ctx, pg } = await signIn(email);
  const reached = [];
  for (const d of ["", ...DEPTS]) {
    const path = d ? `/operations/${d}` : "/operations";
    await pg.goto(BASE + path, { waitUntil: "networkidle" });
    if (new URL(pg.url()).pathname === path) reached.push(path);
  }
  ok(reached.length === 0, `${who} cannot reach the operations portal`, reached.length ? "REACHED " + reached.join(",") : "0 of 6");
  await ctx.close();
}

/* ------------------------------------------------- 4. admins keep full access */
console.log("\n== Administrators keep every department ==\n");
{
  const { ctx, pg } = await signIn("admin@edusphere.com");
  const blocked = [];
  for (const d of DEPTS) {
    await pg.goto(`${BASE}/operations/${d}`, { waitUntil: "networkidle" });
    if (new URL(pg.url()).pathname !== `/operations/${d}`) blocked.push(d);
  }
  ok(blocked.length === 0, "admin opens all five departments", blocked.length ? "blocked on " + blocked.join(",") : "5/5");

  await pg.goto(`${BASE}/operations`, { waitUntil: "networkidle" });
  const hub = await pg.locator("body").innerText();
  ok(DEPTS.every((d) => hub.toLowerCase().includes(d)), "the hub lists all five for an admin");

  // old bookmarks still work
  const moved = [];
  for (const d of DEPTS) {
    await pg.goto(`${BASE}/admin/${d}`, { waitUntil: "networkidle" });
    if (new URL(pg.url()).pathname !== `/operations/${d}`) moved.push(d);
  }
  ok(moved.length === 0, "old /admin/<dept> URLs redirect to the new ones", moved.length ? "not redirected: " + moved.join(",") : "5/5");
  await ctx.close();
}

console.log(`\n===== ${pass}/${pass + fail} operations checks passed =====\n`);
await browser.close();
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
