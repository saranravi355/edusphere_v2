import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';
import { OPERATIONS_PORTAL_ROLES, isOperationsRole } from '@/lib/operations';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path === '/') {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;
  let parsedSession = null;
  
  if (session) {
    try {
      parsedSession = await decrypt(session);
    } catch (e) {
      console.error(e);
    }
  }

  const isProtectedRoute =
    path.startsWith('/admin') ||
    path.startsWith('/teacher') ||
    path.startsWith('/parent') ||
    path.startsWith('/student') ||
    path.startsWith('/operations');

  if (isProtectedRoute && !parsedSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (parsedSession) {
    const role = parsedSession.user.role;
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
