/**
 * Checks the password rules that keep the school's accounts closed.
 *
 * Run it with VERIFY_SECURITY.bat, or:
 *   npx tsc src/lib/password.ts --outDir .verify --module esnext --target es2022 --moduleResolution bundler --skipLibCheck
 *   node scripts/verify-password-rules.mjs
 *
 * It imports the real module rather than a copy of it, so it fails if someone
 * loosens a rule — which is the only reason it exists.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { existsSync, renameSync } from "node:fs";

const built = resolve(".verify/password.js");
const asModule = resolve(".verify/password.mjs");
if (existsSync(built)) renameSync(built, asModule);
if (!existsSync(asModule)) {
  console.error("Compile src/lib/password.ts into .verify first — see the header of this file, or run VERIFY_SECURITY.bat.");
  process.exit(1);
}

const {
  hashPassword, verifyPassword, generateTempPassword, passwordProblem, isHashed,
} = await import(pathToFileURL(asModule).href);

let failed = 0;
const check = (cond, label) => {
  console.log(`${cond ? "  pass" : "  FAIL"}  ${label}`);
  if (!cond) failed++;
};

console.log("\nOne-time passwords");
const generated = new Set();
for (let i = 0; i < 5000; i++) generated.add(generateTempPassword());
check(generated.size === 5000, "5000 generated, 5000 distinct");
check([...generated].every((p) => /^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/.test(p)), "shape is xxxx-xxxx-xxxx");
check([...generated].every((p) => !/[0125OIlSZ]/.test(p)), "no character that is misread when read aloud");
check([...generated].every((p) => passwordProblem(p) === null), "a generated password would itself be accepted");

console.log("\nWhat a person may choose");
check(passwordProblem("password123") !== null, "rejects the password every account used to have");
check(passwordProblem("Password123") !== null, "rejects it whatever the casing");
check(passwordProblem("changeme123") !== null, "rejects the other seeded one");
check(passwordProblem("short1") !== null, "rejects fewer than ten characters");
check(passwordProblem("aaaaaaaaaaaa") !== null, "rejects one character repeated");
check(passwordProblem("meena.krishnan26", { email: "meena.k@edusphere.com" }) !== null, "rejects one built from the email address");
check(passwordProblem("meenaisgreat99", { name: "Meena Krishnan" }) !== null, "rejects one built from the name");
check(passwordProblem("correct horse battery staple") === null, "accepts a passphrase");
check(passwordProblem("Tw1light-Ferns!") === null, "accepts an ordinary strong password");

console.log("\nStorage");
const temp = generateTempPassword();
const stored = await hashPassword(temp);
check(isHashed(stored), "the stored value is tagged scrypt$");
check(!stored.includes(temp), "the plaintext cannot be read back out of it");
check((await verifyPassword(temp, stored)).valid, "the password verifies");
check(!(await verifyPassword(temp + "x", stored)).valid, "a near miss does not");
check(!(await verifyPassword("password123", stored)).valid, "password123 does not open a new account");
check((await hashPassword(temp)) !== stored, "two hashes of one password differ, so the salt is doing its job");

console.log("\nThe legacy plaintext path");
const legacy = await verifyPassword("password123", "password123");
check(legacy.valid && legacy.needsUpgrade, "an un-hashed row still signs in, and is flagged to be re-hashed");
check(!(await verifyPassword("anything", "")).valid, "an empty stored value never matches");

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) FAILED.\n`);
process.exit(failed ? 1 : 0);
