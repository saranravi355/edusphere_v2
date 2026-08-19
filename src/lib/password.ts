import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  pw: string | Buffer, salt: string | Buffer, keylen: number,
) => Promise<Buffer>;

/**
 * Password hashing using Node's built-in scrypt — no extra dependency, and
 * memory-hard, so it resists GPU cracking far better than a plain digest.
 *
 * Stored format:  scrypt$<saltHex>$<hashHex>
 *
 * Every account in this database was seeded with the literal string
 * "password123" in a plaintext column. Anyone with read access to the database
 * — or a leaked backup — had every account, including every parent's. Rather
 * than force a reset for 365 users, `verifyPassword` still accepts a legacy
 * plaintext value, and `login()` transparently re-hashes it on the next
 * successful sign-in, so the column drains itself as people log in.
 */

const KEYLEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(plain, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function isHashed(stored: string): boolean {
  return typeof stored === "string" && stored.startsWith("scrypt$");
}

/**
 * Returns whether the password matches, and whether the stored value is a
 * legacy plaintext that should be upgraded.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!stored) return { valid: false, needsUpgrade: false };

  if (!isHashed(stored)) {
    // Legacy plaintext. Compare in constant time anyway.
    const a = Buffer.from(plain);
    const b = Buffer.from(stored);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return { valid, needsUpgrade: valid };
  }

  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return { valid: false, needsUpgrade: false };
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(plain, Buffer.from(saltHex, "hex"), KEYLEN);
  const valid = expected.length === actual.length && timingSafeEqual(expected, actual);
  return { valid, needsUpgrade: false };
}
