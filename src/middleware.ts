import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

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

  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/teacher') || path.startsWith('/parent');

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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
