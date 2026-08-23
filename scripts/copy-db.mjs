/**
 * Copy every row from one PostgreSQL database into another.
 *
 * Written to move this school's data from the Supabase project in Tokyo
 * (ap-northeast-1) to a new one in Mumbai (ap-south-1), which has since been
 * done. A single round trip to the Tokyo database measured 651-813ms from the
 * serverless function; a page makes between 4 and 22 of them. After the move
 * the same round trip measures about 12ms.
 *
 * An earlier version of this comment estimated 170ms from geography alone.
 * The measured figure was four times worse, which is the usual lesson about
 * estimating latency instead of measuring it.
 *
 *   node scripts/copy-db.mjs            # copy, refusing to touch a non-empty target
 *   node scripts/copy-db.mjs --truncate # wipe the target first, then copy
 *   node scripts/copy-db.mjs --verify   # compare row counts only, change nothing
 *
 * It refuses to overwrite a target that holds more rows than the source, since
 * that is what a reversed copy looks like. --i-mean-it overrides that.
 *
 * Source comes from DIRECT_URL (or DATABASE_URL).
 * Target comes from TARGET_DIRECT_URL (or TARGET_DATABASE_URL).
 * Both are read from the environment or from .env in the repo root.
 *
 * Run `npx prisma migrate deploy` against the target FIRST so the tables and
 * Prisma's own _prisma_migrations bookkeeping exist. This script only moves
 * rows; it never creates or alters a table.
 *
 * Every value is read as text and handed back to PostgreSQL as text, so the
 * target parses it in its own type context. Nothing is round-tripped through a
 * JavaScript Date or Number, which is where this kind of copy usually loses
 * precision or shifts a timestamp by a timezone.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const CHUNK = 500;
const SKIP = new Set(["_prisma_migrations"]);

/* ------------------------------------------------------------------ config */
function env() {
  const merged = { ...process.env };
  const file = path.join(process.cwd(), ".env");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
      if (m && !process.env[m[1]]) merged[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return merged;
}

const mask = (u) => String(u).replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");

const host = (u) => { try { return new URL(u).host; } catch { return "(unparseable)"; } };

/** Host + database name. Same host, different database, is a legitimate copy. */
const identity = (u) => {
  try { const p = new URL(u); return `${p.host}${p.pathname}`; } catch { return String(u); }
};

function connect(url, label) {
  if (!url) throw new Error(`No connection string for the ${label}.`);
  if (url.startsWith("file:")) throw new Error(`${label} points at SQLite, not PostgreSQL.`);
  if (/pgbouncer=true/.test(url) || /:6543\//.test(url)) {
    throw new Error(
      `${label} is the transaction pooler (port 6543). Use the session pooler / direct URL ` +
      `(port 5432) for a bulk copy — the transaction pooler cannot hold one transaction open.`,
    );
  }
  return new pg.Client({
    connectionString: url,
    ssl: /supabase|amazonaws|render|neon/.test(url) ? { rejectUnauthorized: false } : undefined,
    statement_timeout: 0,
  });
}

/* -------------------------------------------------------------- discovery */
async function tablesOf(client) {
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );
  return rows.map((r) => r.tablename).filter((t) => !SKIP.has(t));
}

async function columnsOf(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

/**
 * Order the tables so a parent is always inserted before its children.
 * Verified against this schema: no table has a foreign key onto itself, so a
 * plain topological sort over the table-level dependency graph is sufficient.
 */
async function insertOrder(client, tables) {
  const { rows } = await client.query(
    `SELECT tc.table_name AS child, ccu.table_name AS parent
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`,
  );

  const set = new Set(tables);
  const parents = new Map(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of rows) {
    if (child !== parent && set.has(child) && set.has(parent)) parents.get(child).add(parent);
  }

  const ordered = [];
  const done = new Set();
  while (ordered.length < tables.length) {
    const ready = tables.filter((t) => !done.has(t) && [...parents.get(t)].every((p) => done.has(p)));
    if (ready.length === 0) {
      const stuck = tables.filter((t) => !done.has(t));
      throw new Error(`Circular foreign keys among: ${stuck.join(", ")}`);
    }
    for (const t of ready) { ordered.push(t); done.add(t); }
  }
  return ordered;
}

/* ------------------------------------------------------------------- copy */
async function countAll(client, tables) {
  const out = {};
  for (const t of tables) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${t}"`);
    out[t] = rows[0].n;
  }
  return out;
}

async function copyTable(source, target, table) {
  const cols = await columnsOf(target, table);
  if (cols.length === 0) throw new Error(`Target has no columns for "${table}" — run prisma migrate deploy first.`);

  // Read as text so the target parses each value in its own type context.
  const selectList = cols.map((c) => `"${c}"::text AS "${c}"`).join(", ");
  const { rows } = await source.query(`SELECT ${selectList} FROM "${table}"`);
  if (rows.length === 0) return 0;

  const colSql = cols.map((c) => `"${c}"`).join(", ");
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const values = [];
    const tuples = chunk
      .map((row, r) =>
        "(" +
        cols.map((c, j) => { values.push(row[c] ?? null); return `$${r * cols.length + j + 1}`; }).join(", ") +
        ")",
      )
      .join(", ");
    const res = await target.query(
      `INSERT INTO "${table}" (${colSql}) VALUES ${tuples} ON CONFLICT DO NOTHING`,
      values,
    );
    written += res.rowCount;
  }
  return written;
}

/* ------------------------------------------------------------------- main */
async function main() {
  const args = new Set(process.argv.slice(2));
  const truncate = args.has("--truncate");
  const verifyOnly = args.has("--verify");
  const iMeanIt = args.has("--i-mean-it");
  const e = env();

  const sourceUrl = e.DIRECT_URL || e.DATABASE_URL;
  const targetUrl = e.TARGET_DIRECT_URL || e.TARGET_DATABASE_URL;

  if (!sourceUrl) throw new Error("No DIRECT_URL or DATABASE_URL — that is the database being copied FROM.");
  if (!targetUrl) throw new Error("No TARGET_DIRECT_URL or TARGET_DATABASE_URL — that is the database being copied TO.");
  if (identity(sourceUrl) === identity(targetUrl)) {
    throw new Error("Source and target are the same database. Refusing to copy one onto itself.");
  }

  console.log(`  from  ${mask(sourceUrl)}`);
  console.log(`    to  ${mask(targetUrl)}`);
  console.log();

  const source = connect(sourceUrl, "source");
  const target = connect(targetUrl, "target");
  await source.connect();
  await target.connect();
  await source.query("SET TIME ZONE 'UTC'");
  await target.query("SET TIME ZONE 'UTC'");

  try {
    const tables = await tablesOf(target);
    if (tables.length === 0) {
      throw new Error("The target has no tables. Run `npx prisma migrate deploy` against it first.");
    }
    const order = await insertOrder(target, tables);

    const sourceCounts = await countAll(source, tables);
    const expectedTotal = Object.values(sourceCounts).reduce((a, b) => a + b, 0);

    if (verifyOnly) {
      await report(source, target, tables, sourceCounts);
      return;
    }

    const before = await countAll(target, tables);
    const existing = Object.values(before).reduce((a, b) => a + b, 0);
    if (existing > 0 && !truncate) {
      const full = tables.filter((t) => before[t] > 0);
      const where =
        full.slice(0, 6).map((t) => `${t}=${before[t]}`).join(", ") +
        (full.length > 6 ? `, and ${full.length - 6} more` : "");
      throw new Error(
        `The target already holds ${existing} row(s): ${where}.\n` +
        `  A freshly migrated database is not empty — the campus migration seeds one School row —\n` +
        `  so this is normal on a first run. Re-run with --truncate to replace whatever is there.`,
      );
    }

    /*
     * Refuse a copy that looks like it is running backwards.
     *
     * The realistic way to lose this school's data is not a bug in the copy —
     * it is putting the live database in TARGET_ and the empty one in
     * DATABASE_URL, then passing --truncate. That wipes production and replaces
     * it with nothing, and every check above would pass, because an empty
     * source is a perfectly valid source.
     *
     * A real migration copies into a database that is empty or nearly so. If
     * the target holds materially more than the source, the two are almost
     * certainly the wrong way round.
     */
    if (truncate && !iMeanIt && existing > expectedTotal) {
      throw new Error(
        `Refusing to run: this looks reversed.\n` +
        `  source ${host(sourceUrl)} holds ${expectedTotal} rows\n` +
        `  target ${host(targetUrl)} holds ${existing} rows\n` +
        `  --truncate would delete the ${existing} rows in the target and replace them with ${expectedTotal}.\n` +
        `  Check that DATABASE_URL is the database you are copying FROM and TARGET_ is the new, empty one.\n` +
        `  If you really do mean to overwrite the larger database, pass --i-mean-it as well.`,
      );
    }

    console.log(`Copying ${expectedTotal} rows across ${tables.length} tables…\n`);
    await target.query("BEGIN");
    try {
      if (truncate && existing > 0) {
        await target.query(`TRUNCATE ${order.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
      }
      let total = 0;
      for (const table of order) {
        const n = await copyTable(source, target, table);
        total += n;
        const want = sourceCounts[table];
        const flag = n === want ? "" : `  <-- expected ${want}`;
        console.log(`  ${table.padEnd(24)} ${String(n).padStart(6)}${flag}`);
      }
      await target.query("COMMIT");
      console.log(`\nCopied ${total} rows.`);
    } catch (err) {
      await target.query("ROLLBACK");
      console.error("\nRolled back — the target is unchanged.");
      throw err;
    }

    const ok = await report(source, target, tables, sourceCounts);
    if (!ok) process.exitCode = 1;
  } finally {
    await source.end().catch(() => {});
    await target.end().catch(() => {});
  }
}

/**
 * A checksum of a whole table's contents, computed by the database itself.
 *
 * Every row is rendered to text by PostgreSQL, sorted, and hashed. Matching
 * counts only prove the right number of rows arrived; this proves they say the
 * same thing — timestamps, floating-point scores and password hashes included.
 */
async function checksum(client, table) {
  const { rows } = await client.query(
    `SELECT md5(coalesce(string_agg(x, '|' ORDER BY x), '')) AS h
       FROM (SELECT (t.*)::text AS x FROM "${table}" t) s`,
  );
  return rows[0].h;
}

async function report(source, target, tables, sourceCounts) {
  console.log("\nVerification — row counts:");
  const got = await countAll(target, tables);
  let ok = true;
  for (const t of tables) {
    if (got[t] !== sourceCounts[t]) {
      ok = false;
      console.log(`  MISMATCH  ${t.padEnd(24)} source=${sourceCounts[t]} target=${got[t]}`);
    }
  }
  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
  console.log(
    ok
      ? `  All ${tables.length} tables match (${total} rows).`
      : "  ^ the differences above need investigating before you switch over.",
  );

  console.log("\nVerification — contents:");
  let same = true;
  for (const t of tables) {
    const [a, b] = await Promise.all([checksum(source, t), checksum(target, t)]);
    if (a !== b) { same = false; console.log(`  DIFFERS   ${t}`); }
  }
  console.log(
    same
      ? `  All ${tables.length} tables are byte-for-byte identical to the source.`
      : "  ^ the tables above copied a different number of rows or different values.",
  );

  return ok && same;
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
