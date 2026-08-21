import prisma from "@/lib/prisma";

/**
 * Liveness probe for the database, so a production problem can be identified
 * without reading server logs: visit /api/health.
 *
 * It also reports where the function is running, which database it is talking
 * to, and how long a single round trip to that database costs. Those three
 * numbers diagnose the class of slowness this app hit: the functions defaulted
 * to a Vercel region in the United States while the database was in Tokyo, and
 * a page makes up to 22 round trips. Inferring that from page load times is
 * guesswork; `pingMs` measures it.
 *
 * Returns only counts and timings — no personal data. Any driver error is
 * scrubbed of credentials before being returned, because Prisma connection
 * errors can echo the connection string back.
 */
export const dynamic = "force-dynamic";

function scrub(message: string): string {
  return message
    .replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgresql://<redacted>")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

/**
 * The database hostname, with everything else discarded.
 *
 * A Postgres URL carries the password in its userinfo section, so this returns
 * `hostname` and nothing else — never the parsed URL object, never the original
 * string — so no path through here can leak a credential.
 */
function databaseHost(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "unset";
  try {
    return new URL(raw).hostname;
  } catch {
    return "unparseable";
  }
}

export async function GET() {
  const started = Date.now();
  const where = {
    region: process.env.VERCEL_REGION ?? "local",
    dbHost: databaseHost(),
  };

  try {
    // Connecting is separate from querying. On a cold serverless instance the
    // handshake dominates, and lumping the two together hides which is at fault.
    const connectStart = Date.now();
    await prisma.$connect();
    const connectMs = Date.now() - connectStart;

    // One trivial statement: the cost of a single round trip, and the number
    // every page multiplies by however many queries it makes.
    const pingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const pingMs = Date.now() - pingStart;

    const queryStart = Date.now();
    const [users, students] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
    ]);
    const queryMs = Date.now() - queryStart;

    return Response.json({
      ok: true,
      database: "connected",
      users,
      students,
      ...where,
      connectMs,
      pingMs,
      queryMs,
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        ...where,
        hint:
          "Check DATABASE_URL and DIRECT_URL in Vercel (values must not include surrounding quotes), " +
          "and that the Supabase project is not paused.",
        error: scrub(e instanceof Error ? e.message : String(e)),
        latencyMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
