import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // On Vercel the filesystem is read-only except for /tmp, and SQLite needs to
  // write journal/WAL files even for reads — so we copy the bundled database to
  // /tmp on cold start and point Prisma there.
  const tmpDbPath = path.join("/tmp", "dev.db");

  // The bundled DB may land at different roots depending on how the serverless
  // function is traced, so try the likely locations and use the first that exists.
  const candidateSources = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
    path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
  ];

  try {
    if (!fs.existsSync(tmpDbPath)) {
      const source = candidateSources.find((p) => fs.existsSync(p));
      if (source) {
        fs.copyFileSync(source, tmpDbPath);
        fs.chmodSync(tmpDbPath, 0o666);
        console.log(`[PRISMA] Copied database from ${source} to ${tmpDbPath}`);
      } else {
        console.error(
          `[PRISMA] No bundled database found. cwd=${process.cwd()} — tried: ${candidateSources.join(", ")}`
        );
      }
    }
  } catch (e) {
    console.error("[PRISMA] Error preparing database in /tmp", e);
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:/tmp/dev.db",
      },
    },
  });
} else {
  prisma = new PrismaClient();
}

export default prisma;
