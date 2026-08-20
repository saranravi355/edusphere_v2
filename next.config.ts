import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing to trace explicitly. The database is PostgreSQL, reached over the
  // network via DATABASE_URL, so there is no database file to bundle. The Prisma
  // query engine IS traced automatically when @prisma/client is imported, and must
  // NOT be added here — bundling the whole engines folder blows past Vercel's
  // 250 MB function size limit.

  experimental: {
    serverActions: {
      // Bulk import sends every validated row to a Server Action in one call.
      // The default is 1 MB, which a full-school student file (IMPORT_LIMITS.maxRows
      // = 5000 rows across 17 columns, roughly 2.5 MB of JSON) exceeds. Raising
      // it here is what makes that cap real rather than aspirational.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
