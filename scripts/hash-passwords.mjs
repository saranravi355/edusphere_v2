/**
 * One-off: replace every plaintext password in the User table with a scrypt hash.
 *
 * Safe to run more than once — rows already hashed are skipped. Login also
 * upgrades a legacy row the first time its owner signs in, so this script is
 * about closing the window rather than being strictly required.
 *
 *   node scripts/hash-passwords.mjs
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const prisma = new PrismaClient();

const hash = async (plain) => {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await scrypt(plain, salt, 64)).toString("hex")}`;
};

const users = await prisma.user.findMany({ select: { id: true, email: true, password: true } });
const legacy = users.filter((u) => !u.password?.startsWith("scrypt$"));
console.log(`${users.length} users, ${legacy.length} with a plaintext password.`);

let done = 0;
for (const u of legacy) {
  await prisma.user.update({ where: { id: u.id }, data: { password: await hash(u.password) } });
  if (++done % 50 === 0) console.log(`  ${done}/${legacy.length}`);
}

const remaining = (await prisma.user.findMany({ select: { password: true } }))
  .filter((u) => !u.password.startsWith("scrypt$")).length;
console.log(`Done. Plaintext passwords remaining: ${remaining}`);
if (remaining > 0) process.exitCode = 1;
await prisma.$disconnect();
