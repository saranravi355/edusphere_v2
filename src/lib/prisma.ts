import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // In Vercel, the file system is read-only except for /tmp
  // SQLite needs to write journal files even for reads, so we copy it to /tmp
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const tmpDbPath = path.join("/tmp", "dev.db");

  try {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
        fs.chmodSync(tmpDbPath, 0o666);
      } else {
        console.warn(`[PRISMA] Database not found at ${dbPath}`);
      }
    }
  } catch (e) {
    console.error("[PRISMA] Error copying database to /tmp", e);
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
