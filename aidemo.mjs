/**
 * The 25 new AI preview screens.
 *
 * Loading a page proves very little here: these screens are empty until you
 * press the button, so the part a person actually reads — the results — is the
 * part the mobile sweep never sees. This drives the button on every one of
 * them, then checks the output fits a phone, says on its face that it is a
 * preview, and raises no console errors. It also checks each page is refused
 * to every role it does not belong to.
 */
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:4970';
const key = new TextEncoder().encode(process.env.SESSION_SECRET);

const PAGES = {
  STUDENT: ['exam-readiness','ia-feedback','revision-generator','question-papers','oral-simulator','deadline-risk','scholarships','university-fit'].map(s => `/student/${s}`),
  CLASS_TEACHER: ['lesson-copilot','rubric-feedback','assessment-difficulty','engagement-heatmap','meeting-brief','differentiation','curriculum-qa'].map(s => `/teacher/${s}`),
  SUPER_ADMIN: ['admissions-conversion','hiring-match','capacity-optimizer','budget-variance','compliance-assistant','incident-patterns','ib-policy','accreditation-evidence','meeting-minutes'].map(s => `/admin/ai-insights/${s}`),
  PARENT: ['/parent/handbook-assistant'],
};

async function jwtFor(role) {
  const u = await prisma.user.findFirst({ where: { role }, include: { teacherProfile: true, parentProfile: true } });
  if (!u) throw new Error('no user for ' + role);
  return new SignJWT({ user: u, expires: new Date(Date.now() + 864e5) })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1d').sign(key);
}

let pass = 0, fail = 0;
const ok = (c, name, detail = '') => { c ? pass++ : fail++; console.log(`  ${c ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function ctxFor(role, width = 390) {
  const jwt = await jwtFor(role);
  const ctx = await b.newContext({ viewport: { width, height: 844 } });
  await ctx.addCookies([{ name: 'session', value: jwt, domain: '127.0.0.1', path: '/' }]);
  return ctx;
}

/* ------------------------------------------- 1. the results actually render */
console.log('\n== Each screen produces its output on a 390px phone ==\n');
for (const [role, paths] of Object.entries(PAGES)) {
  const ctx = await ctxFor(role);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  for (const path of paths) {
    errs.length = 0;
    const res = await pg.goto(BASE + path, { waitUntil: 'networkidle' });
    if (res.status() >= 400 || new URL(pg.url()).pathname !== path) {
      ok(false, path, `status ${res.status()} at ${new URL(pg.url()).pathname}`);
      continue;
    }
    const notice = (await pg.locator('body').innerText()).includes('not an analysis of your school') ? 1 : 0;
    // The one primary button inside the control panel — the sidebar has plenty
    // of hidden ones on a phone, so match the panel's own styling, not order.
    const btn = pg.locator('button.text-white.font-bold.rounded-xl');
    const n = await btn.count();
    if (n !== 1) { ok(false, path, `expected one run button, found ${n}`); continue; }
    await btn.click();
    await pg.waitForTimeout(3200);
    const { sw, iw, widest, textLen } = await pg.evaluate(() => {
      const iw = window.innerWidth;
      let widest = null, max = iw;
      for (const el of document.querySelectorAll('main *, body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > max + 1 && r.width > 0) { max = r.right; widest = el.tagName + '.' + (el.className?.toString?.().slice(0, 50) || ''); }
      }
      return { sw: document.documentElement.scrollWidth, iw, widest, textLen: (document.body.innerText || '').length };
    });
    const overflow = sw > iw + 1;
    const good = !overflow && !errs.length && notice > 0 && textLen > 400;
    ok(good, path, [
      overflow ? `overflows ${sw}/${iw} <- ${widest}` : null,
      errs.length ? 'console: ' + errs[0] : null,
      notice ? null : 'no preview notice',
      textLen > 400 ? null : 'page looks empty',
    ].filter(Boolean).join('; ') || `output rendered, ${textLen} chars`);
  }
  await ctx.close();
}

/* --------------------------------------------- 2. nobody reaches the others */
console.log('\n== Every screen is refused to every other role ==\n');
const ALL = Object.values(PAGES).flat();
for (const [role, mine] of Object.entries(PAGES)) {
  const ctx = await ctxFor(role, 1280);
  const pg = await ctx.newPage();
  const leaked = [];
  for (const path of ALL) {
    if (mine.includes(path)) continue;
    await pg.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    if (new URL(pg.url()).pathname === path) leaked.push(path);
  }
  ok(leaked.length === 0, `${role} cannot reach the other ${ALL.length - mine.length} screens`,
     leaked.length ? 'LEAKED ' + leaked.join(',') : 'all refused');

  const blocked = [];
  for (const path of mine) {
    await pg.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    if (new URL(pg.url()).pathname !== path) blocked.push(path);
  }
  ok(blocked.length === 0, `${role} reaches all ${mine.length} of its own`, blocked.length ? 'blocked on ' + blocked.join(',') : `${mine.length}/${mine.length}`);
  await ctx.close();
}

/* ---------------------------------- 3. an operations manager gets none of it */
console.log('\n== An operations manager gets none of them ==\n');
{
  const ctx = await ctxFor('CANTEEN_MANAGER', 1280);
  const pg = await ctx.newPage();
  const leaked = [];
  for (const path of ALL) {
    await pg.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    if (new URL(pg.url()).pathname === path) leaked.push(path);
  }
  ok(leaked.length === 0, `canteen manager cannot reach any of the ${ALL.length}`, leaked.length ? 'LEAKED ' + leaked.join(',') : '0 of ' + ALL.length);
  await ctx.close();
}

/* --------------------------------- 4. the hubs link to everything that exists */
console.log('\n== The hub pages list the new screens ==\n');
for (const [role, hub, want] of [
  ['STUDENT', '/student/ai-tools', PAGES.STUDENT],
  ['CLASS_TEACHER', '/teacher/ai-tools', PAGES.CLASS_TEACHER],
  ['SUPER_ADMIN', '/admin/ai-insights', PAGES.SUPER_ADMIN],
]) {
  const ctx = await ctxFor(role, 1280);
  const pg = await ctx.newPage();
  await pg.goto(BASE + hub, { waitUntil: 'networkidle' });
  const hrefs = await pg.locator('a[href]').evaluateAll(els => els.map(e => e.getAttribute('href')));
  const missing = want.filter(w => !hrefs.includes(w));
  ok(missing.length === 0, `${hub} links to all ${want.length} new tools`, missing.length ? 'missing ' + missing.join(',') : 'all listed');
  await ctx.close();
}

console.log(`\n===== ${pass}/${pass + fail} AI preview checks passed =====\n`);
await b.close(); await prisma.$disconnect();
process.exit(fail ? 1 : 0);
