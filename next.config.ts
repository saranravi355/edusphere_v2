import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // Bundle the SQLite database AND the Prisma engine/client into every
    // serverless function so queries work on Vercel's Linux runtime.
    '/**': [
      './prisma/dev.db',
      './prisma/schema.prisma',
      './node_modules/.prisma/client/**',
      './node_modules/@prisma/engines/**',
    ],
  },
};

export default nextConfig;
