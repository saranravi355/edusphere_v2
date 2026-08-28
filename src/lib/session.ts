import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Signing key for session cookies. This used to be a string literal committed
 * to the repository, which meant anyone with the source could mint a valid
 * session for any user, including an administrator. It now comes from the
 * environment; production refuses to start without it.
 */
const secretKey = process.env.SESSION_SECRET ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("SESSION_SECRET is not set. Refusing to sign sessions with a default key."); })()
    : "dev-only-insecure-key-not-used-in-production"
);
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JWT payload shape is dynamic at the jose boundary; consumers narrow it themselves (session.user.*)
export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

/**
 * What actually goes in the cookie.
 *
 * The previous version signed the entire Prisma `User` row — including the
 * password hash — plus the teacher and parent profiles, and handed it to the
 * browser. A JWT is signed, not encrypted: the payload is base64, readable by
 * anyone holding the cookie or watching it in a devtools panel. Nothing in the
 * application ever read more than id, name and role off the session; the rest
 * was a password hash on a round trip for no reason.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
};

export function sessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword ?? false,
  };
}

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Bump this whenever a change makes an already-issued cookie unsafe to trust.
 *
 * Version 2 exists because version 1 carried the whole user row — password
 * hash included — and, more urgently, carried no `mustChangePassword` flag.
 * A cookie minted the day before the forced reset would sail past the
 * middleware check, since an absent flag reads as false, and its holder would
 * keep the run of the portals for a further 24 hours on a password everybody
 * knows. Middleware rejects any session that is not this version, which costs
 * everyone signed in at deploy time one extra sign-in.
 */
export const SESSION_VERSION = 2;

/** Signs a session for this user and sets the cookie. */
export async function issueSession(user: Parameters<typeof sessionUser>[0]) {
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);
  const token = await encrypt({ v: SESSION_VERSION, user: sessionUser(user), expires });
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
