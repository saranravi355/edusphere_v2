import prisma from "@/lib/prisma";

/**
 * Liveness probe for the database, so a production problem can be identified
 * without reading server logs: visit /api/health.
 *
 * Returns only counts — no personal data. Any driver error is scrubbed of
 * credentials before being returned, because Prisma connection errors can echo
 * the connection string back.
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

export async function GET() {
  const started = Date.now();
  try {
    const [users, students] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
    ]);
    return Response.json({
      ok: true,
      database: "connected",
      users,
      students,
      latencyMs: Date.now() - started,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
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
