import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The SQLite database isn't imported as a module, so Next can't auto-detect it
  // for tracing — we include it explicitly. The Prisma query engine IS traced
  // automatically when @prisma/client is imported, so it must NOT be added here
  // (bundling the whole engines folder blows past Vercel's function size limit).
  outputFileTracingIncludes: {
    '/**': ['./prisma/dev.db'],
  },
};

export default nextConfig;
