import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing to trace explicitly. The database is PostgreSQL, reached over the
  // network via DATABASE_URL, so there is no database file to bundle. The Prisma
  // query engine IS traced automatically when @prisma/client is imported, and must
  // NOT be added here — bundling the whole engines folder blows past Vercel's
  // 250 MB function size limit.
};

export default nextConfig;
