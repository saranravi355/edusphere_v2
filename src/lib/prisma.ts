import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * The database is PostgreSQL (Supabase in hosted environments, an on-premises
 * Postgres server in production at the school). Connection details come from
 * DATABASE_URL; `prisma migrate` uses DIRECT_URL, configured in schema.prisma.
 *
 * In development Next.js hot-reloads modules, which would otherwise create a
 * new client — and a new connection pool — on every reload, so the instance is
 * cached on globalThis. In production the module is evaluated once per
 * serverless instance, so no caching is needed.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
