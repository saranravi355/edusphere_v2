/**
 * Demo mode.
 *
 * This deployment is a demonstration of the platform, not a school running on
 * it. Every account opens with one shared password so that anyone being shown
 * the system can sign in as an administrator, a teacher, a parent or a student
 * without the office minting credentials first.
 *
 * That is a deliberate choice for a demo and an unacceptable one the day real
 * families are in the database, so it is a switch rather than a rewrite. Set
 *
 *     NEXT_PUBLIC_FORCE_PASSWORD_RESET=true
 *
 * in the environment and the whole gate comes back on: new accounts get a
 * single-use password each, everyone is sent to /change-password on their next
 * sign-in, and the login form stops filling the password in for you. Nothing
 * else needs editing.
 *
 * Deliberately free of any Node-only import so the login form, which is a
 * Client Component, can read the same flag the server does. NEXT_PUBLIC_ is
 * read at build time, so changing it means a redeploy, not just a restart.
 */
export const FORCE_PASSWORD_RESET =
  process.env.NEXT_PUBLIC_FORCE_PASSWORD_RESET === "true";

/*
 * DEMO_PASSWORD deliberately does NOT live here. This module is imported by
 * the login form, which is a Client Component, so everything in it is shipped
 * to every browser — and a constant naming the shared password would sit in
 * the public JavaScript bundle even after the switch was flipped. It lives in
 * lib/password.ts, which node:crypto keeps on the server.
 */
