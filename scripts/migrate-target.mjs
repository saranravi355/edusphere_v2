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

const res = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "migrate", "deploy"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: target || targetDirect, DIRECT_URL: targetDirect },
  },
);
process.exit(res.status ?? 1);
