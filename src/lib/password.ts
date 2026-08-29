import { randomBytes, randomInt, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
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
 * "password123" in a plaintext column. Hashing them closed the leaked-backup
 * hole but not the real one: the plaintext was the same for all 370 accounts,
 * it was printed in the login form's default value, and the application had no
 * screen on which anyone could change it. A hash of a password everybody knows
 * is not a secret. So every seeded account now carries `mustChangePassword`,
 * and nobody reaches a portal until they have chosen their own.
 *
 * `verifyPassword` still accepts a legacy plaintext value for the handful of
 * rows a future import might leave un-hashed; `login()` re-hashes on the next
 * successful sign-in, so the column drains itself.
 */

/**
 * The password every account in the demo deployment opens with.
 *
 * Kept here rather than in lib/demo.ts because this module imports node:crypto
 * and so can never be bundled into a browser. Only server code should ever
 * name it. See lib/demo.ts for the switch that stops it being used.
 */
export const DEMO_PASSWORD = "password123";

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

/**
 * Alphabet for temporary passwords: no 0/O, 1/l/I, 5/S, 2/Z. Every one of
 * these is read aloud over a telephone or copied off a printed slip by a
 * parent, and a character pair that cannot be told apart turns into a support
 * call and, eventually, into an office that keeps handing out one password it
 * knows works.
 */
const TEMP_ALPHABET = "abcdefghjkmnpqrtuvwxyz" + "ACDEFGHJKLMNPQRTUVWXY" + "34679";

/**
 * A single-use password for an account someone else has just created. It is
 * shown to the administrator once, handed to the person, and refused after
 * their first sign-in — `mustChangePassword` is set alongside it.
 *
 * Grouped in fours because it is going to be transcribed by hand.
 */
export function generateTempPassword(): string {
  const pick = () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join("");
  return `${group()}-${group()}-${group()}`;
}

/**
 * A short, deliberately unclever list. It exists to stop the specific failure
 * this school already had — one password, known to everyone, never changed —
 * not to police entropy. Long check-lists of symbol classes push people toward
 * `Password@1`; a length floor and a ban on the obvious does more.
 */
const BANNED = new Set([
  "password", "password1", "password12", "password123", "password1234",
  "changeme", "changeme123", "edusphere", "edusphere123", "edusphere360",
  "12345678", "123456789", "1234567890", "qwertyuiop", "iloveyou",
  "welcome123", "admin123", "letmein123", "school123", "student123",
  "teacher123", "parent123",
]);

/**
 * Returns a sentence explaining why the password is not acceptable, or null if
 * it is. The message names the actual problem — "too short" and "that is on
 * the list everyone tries" need different fixes, and a generic
 * "password does not meet requirements" tells the person neither.
 */
export function passwordProblem(
  plain: string,
  who: { email?: string | null; name?: string | null } = {},
): string | null {
  if (plain.length < 10) {
    return "Use at least 10 characters. A short phrase you will remember beats a short jumble you will not.";
  }
  if (plain.length > 200) {
    return "That is longer than 200 characters.";
  }
  const lower = plain.toLowerCase();
  if (BANNED.has(lower) || BANNED.has(lower.replace(/[^a-z0-9]/g, ""))) {
    return "That password is one of the first anyone tries. Please choose another.";
  }
  const local = (who.email ?? "").split("@")[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) {
    return "Please do not build the password out of your email address.";
  }
  const first = (who.name ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first.length >= 4 && lower.includes(first)) {
    return "Please do not build the password out of your name.";
  }
  if (/^(.)\1+$/.test(plain)) {
    return "That is the same character repeated. Please choose another.";
  }
  return null;
}
