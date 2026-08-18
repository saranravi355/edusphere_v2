# SQLite → PostgreSQL migration (Supabase now, on-premises later)

Everything in this document has been dry-run end-to-end against a real PostgreSQL 16
server: all 48 tables created, all 10,660 rows loaded, row counts verified table by
table. What remains is running it against **your** Supabase project, which has to
happen from your machine — the assistant's sandbox cannot reach `*.supabase.co`.

Budget about 20 minutes.

---

## Why Postgres, and why Supabase is only a stepping stone

The school will run an **on-premises database**. Supabase is used here purely as a
**managed PostgreSQL host** so that development, the Vercel demo and the eventual
on-prem server all speak the same dialect. Moving on-prem later is then a
`pg_dump | psql` plus a two-line change in `.env`.

**Rule to keep that true:** do not adopt Supabase Auth, Row Level Security policies,
Supabase Storage, Realtime, or the `supabase-js` SDK. Every database access stays
behind Prisma. Authentication stays in `src/lib/session.ts`. Break this rule and you
create lock-in that will not come with you to the school's server.

## What this also fixes

The old `src/lib/prisma.ts` copied `prisma/dev.db` into `/tmp` on every production
cold start. Every write made in the deployed Vercel demo was discarded on the next
cold start, and concurrent serverless instances each saw a different database. That
whole mechanism is gone.

---

## The target project already exists

You already have a Supabase project named **`edusphere`** in the **Rapdfly** org:

| | |
|---|---|
| Project ref | `mypgubeimwwsjcuzzujm` |
| Region | AWS `ap-northeast-1` (Tokyo) |
| Pooler host | `aws-0-ap-northeast-1.pooler.supabase.com` |
| `public` schema | **empty — 0 tables** |
| Plan | Free (26 MB of 500 MB used, all Supabase internal schemas) |

Because `public` is empty there is nothing to work around: the migration goes
straight in, no separate schema needed. Tokyo rather than Mumbai adds maybe
40-60 ms of latency from Bengaluru, which is not worth recreating the project over
and is irrelevant once the database moves on-premises.

## Step 1 — Just run the script

Double-click **`RUN_POSTGRES_MIGRATION.bat`** in the repo root. It does the whole
cutover: checks the branch, writes `.env`, installs dependencies, creates the
schema, loads the data and type-checks.

The only thing it asks for is the **database password**, at a masked prompt.

## Step 2 — About that password

Supabase does not let you read the database password back after project creation
("The database password isn't viewable after creation"). So either you still have
it, or you reset it:

**Dashboard → edusphere → Database → Settings → Reset database password**

Resetting breaks any existing connections using the old password — with `public`
empty, nothing is currently using it.

The password is read by `scripts/setup-env.ps1` from a masked prompt, percent-encoded,
and written only to `.env` (which is gitignored). It is never echoed, never passed as
a command-line argument, and never leaves your machine. Your previous `.env` is backed
up to `.env.sqlite.bak`.

## Step 3 — What the script writes

```ini
DATABASE_URL="postgresql://postgres.mypgubeimwwsjcuzzujm:<PW>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.mypgubeimwwsjcuzzujm:<PW>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

Two URLs, deliberately. Port 6543 is the transaction-mode pooler, used for runtime
queries so serverless functions don't exhaust connections. Port 5432 is the
session-mode pooler; Prisma Migrate and the data port script cannot run through
pgbouncer's transaction mode, which is why `schema.prisma` declares `directUrl`.

## Step 4 — Create the schema

```bash
npx prisma migrate dev --name init
```

This creates all 48 tables in Supabase **and** writes `prisma/migrations/0_init/` —
the repo's first real migration history. Until now the schema only ever existed as a
`db push` side effect, so this is a genuine improvement: from here on, schema changes
are versioned and reviewable.

Expected output ends with `Your database is now in sync with your schema.`

## Step 5 — Load the data

```bash
npm run db:port
```

Reads `prisma/sqlite-export.json` (2.9 MB, already generated and committed to your
working folder) and inserts every row in foreign-key-safe order inside a single
transaction. Any failure rolls back completely — you cannot end up half-migrated.

It finishes with a table-by-table row-count comparison. You want:

```
Row-count verification:
  All 48 tables match (10660 rows).
```

Useful flags:

| Command | Effect |
|---|---|
| `npm run db:port` | Insert, skipping rows that already exist (`ON CONFLICT DO NOTHING`) |
| `node scripts/port-to-postgres.mjs --truncate` | Wipe every table first, then insert — use to redo a bad run |
| `npm run db:verify` | Compare counts only, change nothing |

To regenerate the JSON from `prisma/dev.db` yourself: `npm run db:export` (needs Python 3).

## Step 6 — Run it

```bash
npm run dev
```

Log in as `aarav.p@edusphere.com` / `password123` and check My Subjects, My Grades and
the admin Live Ops dashboard. Then verify quality with:

```bash
./node_modules/.bin/tsc --noEmit
npx eslint src --quiet
```

## Step 7 — Vercel

In the Vercel project: **Settings → Environment Variables**, add `DATABASE_URL` and
`DIRECT_URL` with the same values, for Production, Preview and Development. Redeploy.

Writes now persist on the deployed demo, which was never true before.

---

## A data repair happened during export

Commit `41eac56` ("dedupe Subject + student name collisions") deleted the IB
Mathematics subject row `cmrbsy3wa00en1g8mb90pbvv3` but left its children pointing at
it. SQLite does not enforce foreign keys, so this went unnoticed: **300 `Grade` rows
and the "Algebra Unit Test" quiz have been referencing a subject that does not
exist**, and any page joining `Grade → Subject` has been silently dropping them.

PostgreSQL rejects this, which is how it surfaced. The exporter repoints those 301
rows to the surviving Mathematics subject (`cmqjctlqd0000al5ehs9jy1ql`, `MATH101`),
declared explicitly in `FK_REMAP` at the top of `scripts/export-sqlite-data.py`. The
exporter also fails loudly on any orphan not listed there, so nothing is dropped
quietly. After the port, Mathematics has its 300 grades back, matching the other five
IB subjects.

## Behavioural difference to be aware of

SQLite's `LIKE` is case-insensitive for ASCII; PostgreSQL's is not. The two
`contains` filters in the teacher student search (`src/app/(portals)/teacher/students/page.tsx`)
now pass `mode: "insensitive"`. **Any new search filter you write needs the same
treatment** — this is the one dialect trap in the codebase.

## Enabling pgvector for the RAG layer

The planned AI work in `EduSphere360_AI_RAG_Prep.docx` needs vector search. Supabase
ships pgvector; enable it once, in the Supabase **SQL Editor**:

```sql
create extension if not exists vector;
```

Prisma 5 does not model `vector` columns natively, so the embeddings table is best
created as its own migration with raw SQL and queried with `$queryRaw`. Not needed
until you start the ingestion pipeline — noted here so the decision is on record.

## Moving to the on-premises server later

1. Provision PostgreSQL 16 on the school's server, create the database and role.
2. `pg_dump "$DIRECT_URL" -Fc -f edusphere.dump`
3. `pg_restore -d "postgresql://edusphere:<PASSWORD>@<HOST>:5432/edusphere360" edusphere.dump`
4. Change `DATABASE_URL` and `DIRECT_URL` in `.env`. Nothing else changes.

Plan for on-prem: automated `pg_dump` backups with off-site copies, TLS on the
connection, and a non-superuser role for the application.

## Before real users touch this

Now that the data lives on a hosted database rather than a file on your laptop, the
existing demo-grade security is a materially bigger risk. Outstanding, in priority order:

1. **Passwords are stored in plaintext** (`User.password`, default `"password123"`) — hash with argon2 or bcrypt.
2. **The JWT secret is hardcoded** in `src/lib/session.ts` — move it to an environment variable and rotate it.
3. No audit trail, no 2FA, no rate limiting on login.

## Rollback

Nothing about this is one-way. `prisma/dev.db` is untouched and still in the repo. To
go back: revert this branch and restore `DATABASE_URL="file:./dev.db"`.

## What changed in the code

| File | Change |
|---|---|
| `prisma/schema.prisma` | `provider = "postgresql"`, added `directUrl` |
| `src/lib/prisma.ts` | Removed the `/tmp` SQLite copy hack; standard pooled singleton |
| `.env.example` | Supabase + on-prem connection string templates |
| `package.json` | Added `pg`; added `db:export`, `db:port`, `db:verify` scripts |
| `scripts/export-sqlite-data.py` | SQLite → JSON export, with FK repair and an integrity gate |
| `scripts/port-to-postgres.mjs` | JSON → PostgreSQL loader, transactional, with count verification |
| `src/app/(portals)/teacher/students/page.tsx` | `mode: "insensitive"` on the search filters |
| `.gitignore` | Ignore the 2.9 MB `prisma/sqlite-export.json` artifact |
