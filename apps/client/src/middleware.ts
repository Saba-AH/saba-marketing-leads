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
/** Accesibles sin sesión. El logout también: tiene que poder limpiar cookies huérfanas. */
const PUBLIC_PATHS = new Set([
  LOGIN_PATH,
  '/api/session/login',
  '/api/session/logout',
]);

/**
 * Puerta del panel. Decide solo "hay sesión o no" (y la renueva si el access
 * token venció); qué puede hacer cada quien lo decide la API en cada petición.
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
    // La petición en curso también tiene que llevar el token nuevo, no solo
    // las siguientes: el route handler o la página lo leen de acá.
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
  // Todo menos los estáticos de Next y los archivos de `public/`.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
