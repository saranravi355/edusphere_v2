import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4970";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let pass = 0, fail = 0;
const ok = (c, n, d = "") => { c ? pass++ : fail++; console.log(`  ${c ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
const errs = [];
pg.on("pageerror", e => errs.push(e.message.split("\n")[0]));
pg.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });

await pg.goto(BASE + "/", { waitUntil: "networkidle" });
ok(errs.length === 0, "landing page renders clean", errs.slice(0, 2).join(" | "));

const labels = await pg.locator('a[href^="/login?role="]').allInnerTexts();
ok(labels.length === 6, "six portal cards", `${labels.length}: ${labels.map(l => l.trim()).join(", ")}`);
ok(labels.some(l => /Operations/i.test(l)), "one of them is Operations");

// no horizontal overflow at desktop or phone
for (const [w, h, name] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.goto(BASE + "/", { waitUntil: "networkidle" });
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= w, `six cards fit at ${name} (${w}px)`, `scrollWidth ${sw}`);
}

// the Operations card leads to a login that knows what it is
await pg.setViewportSize({ width: 1440, height: 900 });
await pg.goto(BASE + "/", { waitUntil: "networkidle" });
await pg.locator('a[href="/login?role=operations"]').click();
await pg.waitForTimeout(1500);
const body = await pg.locator("body").innerText();
ok(/Login to Operations Portal/i.test(body), "the card opens the Operations login", body.split("\n").find(l => /Login to/.test(l)) || "");
const email = await pg.locator('input[type="email"]').inputValue();
ok(email === "canteen@edusphere.com", "prefilled with a department address", email);
ok(/transport@edusphere\.com/.test(body) && /assets@edusphere\.com/.test(body), "the other four departments are listed as alternatives");

// and signing in from here actually lands in a department
await pg.fill('input[type="password"]', "password123");
await pg.click('button[type="submit"]');
await pg.waitForTimeout(3500);
ok(new URL(pg.url()).pathname === "/operations/canteen", "signing in from the card lands on the canteen", new URL(pg.url()).pathname);

// the other five cards still prefill correctly
await ctx.close();
const ctx2 = await b.newContext();
const pg2 = await ctx2.newPage();
for (const [slug, expected] of [
  ["admin", "admin@edusphere.com"], ["principal", "principal@edusphere.com"],
  ["teacher", "meena.k@edusphere.com"], ["student", "aarav.p@edusphere.com"],
  ["parent", "rahul.p@edusphere.com"],
]) {
  await pg2.goto(`${BASE}/login?role=${slug}`, { waitUntil: "networkidle" });
  await pg2.waitForTimeout(400);
  const v = await pg2.locator('input[type="email"]').inputValue();
  ok(v === expected, `${slug} card still prefills correctly`, v);
}
// an unknown role must not render a blank form
await pg2.goto(`${BASE}/login?role=nonsense`, { waitUntil: "networkidle" });
await pg2.waitForTimeout(400);
const fallback = await pg2.locator('input[type="email"]').inputValue();
ok(fallback.length > 0, "an unknown ?role= falls back instead of rendering empty", fallback);

console.log(`\n===== ${pass}/${pass + fail} front-door checks passed =====\n`);
await b.close();
process.exit(fail ? 1 : 0);
