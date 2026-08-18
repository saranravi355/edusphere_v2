/**
 * Load the SQLite export (prisma/sqlite-export.json) into PostgreSQL.
 *
 *   node scripts/port-to-postgres.mjs              # insert, skipping rows that already exist
 *   node scripts/port-to-postgres.mjs --truncate   # wipe every table first, then insert
 *   node scripts/port-to-postgres.mjs --verify     # only compare row counts, change nothing
 *
 * Reads the connection string from DIRECT_URL, or DATABASE_URL if that is unset
 * (either from the real environment or from a .env file in the repo root).
 * Run `npx prisma migrate deploy` first so the tables exist.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const EXPORT_FILE = path.join("prisma", "sqlite-export.json");
const CHUNK = 500;

function connectionString() {
  let env = { ...process.env };
  const envFile = path.join(process.cwd(), ".env");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = env.DIRECT_URL || env.DATABASE_URL;
  if (!url) throw new Error("No DIRECT_URL or DATABASE_URL found (checked the environment and .env).");
  if (url.startsWith("file:")) throw new Error("DATABASE_URL still points at SQLite — set it to your Postgres URL first.");
  return url;
}

const mask = (u) => u.replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");

async function main() {
  const args = new Set(process.argv.slice(2));
  const truncate = args.has("--truncate");
  const verifyOnly = args.has("--verify");

  if (!fs.existsSync(EXPORT_FILE)) throw new Error(`Missing ${EXPORT_FILE} — run scripts/export-sqlite-data.py first.`);
  const { order, tables } = JSON.parse(fs.readFileSync(EXPORT_FILE, "utf8"));

  const url = connectionString();
  console.log(`Connecting to ${mask(url)}`);
  const client = new pg.Client({
    connectionString: url,
    ssl: /supabase|amazonaws|render|neon/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const expected = Object.fromEntries(order.map((t) => [t, tables[t].length]));

  if (verifyOnly) {
    await report(client, order, expected);
    await client.end();
    return;
  }

  if (truncate) {
    console.log("Truncating all target tables…");
    const list = order.map((t) => `"${t}"`).join(", ");
    await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  }

  let inserted = 0;
  await client.query("BEGIN");
  try {
    for (const table of order) {
      const rows = tables[table];
      if (rows.length === 0) { console.log(`  ${table.padEnd(22)} ${String(0).padStart(6)}  (empty)`); continue; }
      const cols = Object.keys(rows[0]);
      const colSql = cols.map((c) => `"${c}"`).join(", ");

      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const values = [];
        const placeholders = chunk.map((row, r) =>
          "(" + cols.map((c, j) => { values.push(row[c] ?? null); return `$${r * cols.length + j + 1}`; }).join(", ") + ")"
        ).join(", ");
        const res = await client.query(
          `INSERT INTO "${table}" (${colSql}) VALUES ${placeholders} ON CONFLICT DO NOTHING`, values);
        inserted += res.rowCount;
      }
      console.log(`  ${table.padEnd(22)} ${String(rows.length).padStart(6)}`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nRolled back — nothing was written.");
    throw err;
  }

  console.log(`\nInserted ${inserted} rows.`);
  const ok = await report(client, order, expected);
  await client.end();
  if (!ok) process.exitCode = 1;
}

async function report(client, order, expected) {
  console.log("\nRow-count verification:");
  let ok = true;
  for (const table of order) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
    const got = rows[0].n, want = expected[table];
    if (got !== want) { ok = false; console.log(`  MISMATCH  ${table.padEnd(22)} sqlite=${want} postgres=${got}`); }
  }
  const total = Object.values(expected).reduce((a, b) => a + b, 0);
  console.log(ok ? `  All ${order.length} tables match (${total} rows).` : "  ^ differences above need investigating.");
  return ok;
}

main().catch((e) => { console.error("\nFAILED:", e.message); process.exit(1); });
