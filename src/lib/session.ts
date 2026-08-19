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
