/**
 * Run `prisma migrate deploy` against the TARGET database rather than the live one.
 *
 *   node scripts/migrate-target.mjs
 *
 * Reads TARGET_DATABASE_URL / TARGET_DIRECT_URL from .env and passes them to
 * Prisma as DATABASE_URL / DIRECT_URL for that one command. Doing the parsing
 * here rather than in a .bat file matters: a connection string contains "&" and
 * often percent-escapes in the password, and Windows batch mangles both.
 *
 * Prints the host it is about to migrate and refuses to run against the same
 * database the app is currently using, so a mistyped .env cannot quietly
 * re-migrate production.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function readEnvFile() {
  const file = path.join(process.cwd(), ".env");
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const identity = (u) => {
  try { const p = new URL(u); return `${p.host}${p.pathname}`; } catch { return String(u); }
};
const host = (u) => { try { return new URL(u).host; } catch { return "(unparseable)"; } };

const file = readEnvFile();
const target = file.TARGET_DATABASE_URL || process.env.TARGET_DATABASE_URL;
const targetDirect = file.TARGET_DIRECT_URL || process.env.TARGET_DIRECT_URL || target;
const current = file.DATABASE_URL || process.env.DATABASE_URL;

if (!target && !targetDirect) {
  console.error("No TARGET_DATABASE_URL or TARGET_DIRECT_URL in .env. Add them first.");
  process.exit(1);
}
if (current && identity(current) === identity(targetDirect)) {
  console.error("TARGET_ points at the same database as DATABASE_URL. Refusing to run.");
  process.exit(1);
}

console.log(`Migrating: ${host(targetDirect)}`);
if (!/ap-south-1/.test(host(targetDirect))) {
  console.log("Note: that host does not mention ap-south-1. Check it is the Mumbai project.");
}
console.log();

const childEnv = { ...process.env, DATABASE_URL: target || targetDirect, DIRECT_URL: targetDirect };

/*
 * Run the Prisma CLI as a plain .js file under this same Node binary.
 *
 * The obvious `npx prisma migrate deploy` does not work here. On Windows npx is
 * npx.cmd, and since the fix for CVE-2024-27980 Node refuses to spawn a .cmd or
 * .bat without shell:true — it fails before the child starts, so Prisma prints
 * nothing at all and the only symptom is an exit code. That is exactly how this
 * failed the first time.
 *
 * node_modules/prisma/build/index.js is the same entry point npx would reach,
 * with no shell and no platform-specific launcher in between.
 */
const cli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const args = ["migrate", "deploy"];

const res = fs.existsSync(cli)
  ? spawnSync(process.execPath, [cli, ...args], { stdio: "inherit", env: childEnv })
  : spawnSync("npx", ["prisma", ...args], { stdio: "inherit", env: childEnv, shell: true });

if (res.error) {
  console.error(`\nCould not start the Prisma CLI: ${res.error.message}`);
  if (!fs.existsSync(cli)) {
    console.error(`Looked for ${cli} and it is not there. Run "npm install" first.`);
  }
  process.exit(1);
}
if (res.status !== 0) {
  console.error(`\nPrisma exited with code ${res.status}. The message above says why.`);
  console.error(
    "\nIf it says P1000 (authentication failed), the password in TARGET_ is not the\n" +
    "one the database actually has. A Supabase project created through the API or\n" +
    "MCP has a generated password that is never displayed — the Connect dialog just\n" +
    "shows [YOUR-PASSWORD] as a placeholder, so substituting a password of your own\n" +
    "choosing there does not set it. Reset it: dashboard - project - Settings -\n" +
    "Database - Reset database password, then put the new one in BOTH TARGET_ lines.\n" +
    "\nIf it says P1001 (cannot reach the server), the host or port is wrong instead.",
  );
}
process.exit(res.status ?? 1);
