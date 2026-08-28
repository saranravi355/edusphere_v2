import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, SESSION_VERSION } from '@/lib/session';
import { OPERATIONS_PORTAL_ROLES, isOperationsRole } from '@/lib/operations';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path === '/') {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;
  let parsedSession = null;
  
  let staleSession = false;

  if (session) {
    try {
      parsedSession = await decrypt(session);
    } catch (e) {
      console.error(e);
    }
  }

  // A cookie from before the forced password reset verifies perfectly well —
  // it was signed with the same key — but it predates the mustChangePassword
  // flag, and an absent flag reads as false. Left alone, everyone already
  // signed in would keep a full day's access on the shared password. Refuse
  // anything that is not the current version and make them sign in again.
  if (parsedSession && parsedSession.v !== SESSION_VERSION) {
    parsedSession = null;
    staleSession = true;
  }

  const isProtectedRoute =
    path.startsWith('/admin') ||
    path.startsWith('/teacher') ||
    path.startsWith('/parent') ||
    path.startsWith('/student') ||
    path.startsWith('/operations');

  if (isProtectedRoute && !parsedSession) {
    const response = NextResponse.redirect(new URL('/', request.url));
    if (staleSession) response.cookies.delete('session');
    return response;
  }

  // An account that has never had a password of its own reaches exactly one
  // screen. Every seeded account shared the password "password123" and the
  // application had no way to change it; this check is what makes the reset
  // unavoidable rather than a suggestion. It reads the flag off the signed
  // cookie because middleware runs on the edge, where Prisma cannot follow —
  // and the cookie is re-issued the moment the password changes.
  if (parsedSession?.user?.mustChangePassword && path !== '/change-password') {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
  }

  if (parsedSession) {
    const role = parsedSession.user.role;

    // Anyone signed in may always reach the change-password screen. Without
    // this the operations redirect at the foot of this block would bounce a
    // department manager off it and into a portal — which, for an account that
    // has not reset yet, is the one place it must not go.
    if (path === '/change-password') {
      return NextResponse.next();
    }
    // Role-based routing protection
    if (path.startsWith('/admin') && role !== 'SUPER_ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/teacher') && role !== 'CLASS_TEACHER' && role !== 'SUBJECT_TEACHER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/parent') && role !== 'PARENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/student') && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // The operations portal: administrators plus the five department managers.
    // Which department each manager may open is decided by the layouts and by
    // every server action, not here — middleware cannot see an action call.
    if (path.startsWith('/operations') && !OPERATIONS_PORTAL_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // A manager has no business anywhere else in the app, and their portal is
    // not /admin, so send them home rather than leaving them on a blank page.
    if (isOperationsRole(role) && !path.startsWith('/operations')) {
      return NextResponse.redirect(new URL('/operations', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
