import { type NextRequest, NextResponse } from 'next/server';
import { loginPathFor } from '@/lib/session/safeNextPath';
import {
  clearSessionCookies,
  SESSION_COOKIES,
  writeSessionCookies,
} from '@/lib/session/sessionCookies';
import { sessionExpiredResponse } from '@/lib/session/sessionErrors';
import { refreshSession } from '@/lib/session/upstream';

const LOGIN_PATH = '/login';
/** Reachable without a session. Logout too: it has to be able to clear orphaned cookies. */
const PUBLIC_PATHS = new Set([
  LOGIN_PATH,
  '/api/session/login',
  '/api/session/logout',
]);

/**
 * The panel's gate. It only decides "is there a session or not" (and renews it
 * if the access token expired); what each person can do is decided by the API
 * on every request.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const access = request.cookies.get(SESSION_COOKIES.access)?.value;
  const refresh = request.cookies.get(SESSION_COOKIES.refresh)?.value;

  if (pathname === LOGIN_PATH) {
    return access || refresh
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }
  if (PUBLIC_PATHS.has(pathname) || access) return NextResponse.next();

  const tokens = refresh ? await refreshSession(request, refresh) : null;
  if (tokens) {
    // The in-flight request also has to carry the new token, not just the next
    // ones: the route handler or the page read it from here.
    request.cookies.set(SESSION_COOKIES.access, tokens.accessToken);
    request.cookies.set(SESSION_COOKIES.refresh, tokens.refreshToken);
    const response = NextResponse.next({ request });
    writeSessionCookies(response.cookies, tokens);
    return response;
  }

  if (pathname.startsWith('/api/')) return sessionExpiredResponse();

  const response = NextResponse.redirect(
    new URL(loginPathFor(`${pathname}${search}`), request.url)
  );
  clearSessionCookies(response.cookies);
  return response;
}

export const config = {
  // Everything except Next's static assets and the `public/` files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
