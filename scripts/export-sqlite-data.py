#!/usr/bin/env python3
"""
Export every row of the legacy SQLite database (prisma/dev.db) to a single
JSON file that `scripts/port-to-postgres.mjs` can load into PostgreSQL.

Run from the repo root:   python scripts/export-sqlite-data.py

Conversions applied (see the notes in PROJECT_CONTEXT.md):
  DATETIME -> stored in SQLite as epoch MILLISECONDS (integers); emitted here
              as ISO-8601 UTC strings, which Postgres accepts for timestamp(3).
  BOOLEAN  -> stored as 0/1; emitted as JSON true/false.
Tables are emitted in foreign-key-safe order so a plain sequential insert works.
"""
import json, sqlite3, sys, os
from datetime import datetime, timezone

DB = os.path.join("prisma", "dev.db")
OUT = os.path.join("prisma", "sqlite-export.json")

# ---------------------------------------------------------------------------
# Known data repairs applied during export.
#
# SQLite never enforced foreign keys, so the legacy database carries orphaned
# references that PostgreSQL will (correctly) reject. Each one is remapped
# explicitly here rather than silently dropped, so the fix is reviewable.
#
# 1. Commit 41eac56 ("dedupe Subject ... collisions") deleted the IB Mathematics
#    subject row cmrbsy3wa00en1g8mb90pbvv3 but left its children pointing at it:
#    300 Grade rows and the "Algebra Unit Test" Quiz. The surviving Mathematics
#    subject is cmqjctlqd0000al5ehs9jy1ql (MATH101), so repoint them there.
#    (This is also a live bug in the running app — those grades currently join
#    to nothing.)
# ---------------------------------------------------------------------------
FK_REMAP = {
    ("Grade", "subjectId"): {"cmrbsy3wa00en1g8mb90pbvv3": "cmqjctlqd0000al5ehs9jy1ql"},
    ("Quiz",  "subjectId"): {"cmrbsy3wa00en1g8mb90pbvv3": "cmqjctlqd0000al5ehs9jy1ql"},
}

def main():
    if not os.path.exists(DB):
        sys.exit(f"Cannot find {DB} — run this from the repo root.")
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row

    tables = [r[0] for r in con.execute(
        "select name from sqlite_master where type='table' "
        "and name not like 'sqlite_%' and name not like '_prisma%' order by name")]

    # column name -> declared type, per table
    coltypes = {t: {r[1]: r[2] for r in con.execute(f'PRAGMA table_info("{t}")')} for t in tables}

    # build the FK dependency graph and topologically sort it
    deps = {t: set() for t in tables}
    for t in tables:
        for r in con.execute(f'PRAGMA foreign_key_list("{t}")'):
            parent = r[2]
            if parent in deps and parent != t:
                deps[t].add(parent)
    order, seen = [], set()
    while len(order) < len(tables):
        ready = sorted(t for t in tables if t not in seen and deps[t] <= seen)
        if not ready:  # cycle — fall back to alphabetical for the remainder
            ready = sorted(t for t in tables if t not in seen)
            print(f"! FK cycle detected, appending remaining tables unordered: {ready}", file=sys.stderr)
        for t in ready:
            order.append(t); seen.add(t)

    def convert(value, declared):
        if value is None:
            return None
        if declared == "DATETIME":
            # epoch milliseconds -> ISO-8601 UTC
            if isinstance(value, (int, float)):
                return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()
            return str(value)          # already a string; pass through
        if declared == "BOOLEAN":
            return bool(value)
        return value

    payload, total, repaired = {}, 0, 0
    for t in order:
        types = coltypes[t]
        rows = []
        for row in con.execute(f'select * from "{t}"'):
            rec = {k: convert(row[k], types.get(k, "TEXT")) for k in row.keys()}
            for (rt, rc), mapping in FK_REMAP.items():
                if rt == t and rec.get(rc) in mapping:
                    rec[rc] = mapping[rec[rc]]
                    repaired += 1
            rows.append(rec)
        payload[t] = rows
        total += len(rows)
        print(f"  {t:<22} {len(rows):>6}")

    # Fail loudly on any orphan we have not explicitly decided how to handle.
    problems = []
    for t in order:
        for r in con.execute(f'PRAGMA foreign_key_list("{t}")'):
            parent, frm, to = r[2], r[3], (r[4] or "id")
            if parent not in payload:
                continue
            valid = {row[to] for row in payload[parent]}
            bad = {row[frm] for row in payload[t] if row.get(frm) is not None and row[frm] not in valid}
            if bad:
                problems.append(f"  {t}.{frm} -> {parent}.{to}: {len(bad)} unmatched value(s), e.g. {sorted(bad)[:3]}")
    if problems:
        print("\nUnresolved foreign-key orphans — PostgreSQL will reject these:", file=sys.stderr)
        print("\n".join(problems), file=sys.stderr)
        print("Add them to FK_REMAP (or clean them in SQLite) and re-run.", file=sys.stderr)
        sys.exit(1)

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"order": order, "tables": payload}, fh, ensure_ascii=False)

    size = os.path.getsize(OUT) / 1_000_000
    print(f"\nWrote {OUT} — {len(order)} tables, {total} rows, {size:.1f} MB")
    if repaired:
        print(f"Repaired {repaired} orphaned foreign-key reference(s) via FK_REMAP.")
    print("Foreign-key integrity: OK (every reference resolves).")

if __name__ == "__main__":
    main()
