/**
 * Decide whether this build is allowed to migrate the production database.
 *
 * THE PROBLEM THIS EXISTS TO FIX
 *
 * `build` used to be `prisma generate && prisma migrate deploy && next build`,
 * and Vercel builds every branch. Preview builds get the production environment
 * variables, so `prisma migrate deploy` ran against the live database on every
 * push of every branch — before anyone had opened the pull request, let alone
 * reviewed it.
 *
 * That is not a theory. Over two days it applied an index migration, an RLS
 * migration, a data migration that rewrote 246 academic records, and a delete
 * of 105 more, each one landing in production within a minute of `git push`.
 * They were all fine, because each had been dry-run first and carried its own
 * backup table. That was a person being careful, not a pipeline being safe.
 *
 * WHAT THIS DOES INSTEAD
 *
 *   Production deploy   → migrate. This is the deploy of `main`, after review
 *                         and merge, which is exactly the gate that was missing.
 *   Preview build       → do not migrate. Report what is pending, so the drift
 *                         is visible in the build log rather than silent, and
 *                         carry on building. A branch still gets its preview.
 *   Local / anything    → do not migrate. `npm run build` on a laptop has no
 *                         business writing to the school's database.
 *
 * To apply migrations by hand at any time:  npm run db:migrate
 *
 * Failing to migrate on a production deploy is deliberately fatal: shipping code
 * whose Prisma client expects a column the database does not have is worse than
 * not shipping.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const force = process.argv.includes("--force") || process.env.MIGRATE_DEPLOY === "1";
const env = process.env.VERCEL_ENV; // "production" | "preview" | "development" | undefined
const isProductionDeploy = env === "production";

/**
 * Prisma's CLI is a plain JS file, so it is run with this same node binary.
 *
 * Not `npx`: on Windows that resolves to npx.cmd, and since the fix for
 * CVE-2024-27980 Node refuses to spawn a .cmd without `shell: true` — it fails
 * with no output at all, which is exactly how the first version of this script
 * looked like it was working while doing nothing. Not `shell: true` either,
 * because passing an argument array through a shell skips escaping and Node
 * warns about it. Calling the file directly avoids both.
 */
const PRISMA_CLI = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

function run(args, { fatal }) {
  const r = spawnSync(process.execPath, [PRISMA_CLI, ...args], { stdio: "inherit" });
  if (r.error) {
    console.error(`[migrate] Could not start the Prisma CLI: ${r.error.message}`);
    if (fatal) process.exit(1);
    return 1;
  }
  if (fatal && r.status !== 0) process.exit(r.status ?? 1);
  return r.status ?? 1;
}

if (force || isProductionDeploy) {
  console.log(
    force
      ? "[migrate] Applying migrations (asked for explicitly)."
      : "[migrate] Production deploy — applying migrations.",
  );
  run(["migrate", "deploy"], { fatal: true });
} else {
  const where = env ? `VERCEL_ENV=${env}` : "local build";
  console.log(`[migrate] Not a production deploy (${where}) — the database will not be touched.`);
  console.log("[migrate] Pending migrations, for information only:");
  // Read-only. Its exit code is non-zero whenever anything is pending, which is
  // the normal state of a branch that adds one, so it must not fail the build.
  run(["migrate", "status"], { fatal: false });
  console.log("[migrate] Run `npm run db:migrate` to apply these deliberately.");
}
