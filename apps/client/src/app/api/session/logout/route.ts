import { type NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookies,
  SESSION_COOKIES,
} from '@/lib/session/sessionCookies';
import { forbiddenOriginResponse } from '@/lib/session/sessionErrors';
import {
  forwardedHeaders,
  isSameOrigin,
  refreshSession,
  upstreamUrl,
} from '@/lib/session/upstream';

/**
 * Cierra la sesión también en Supabase, no solo en el navegador: borrar las
 * cookies sin revocar dejaría el refresh token vivo hasta que venza.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();

  const access = request.cookies.get(SESSION_COOKIES.access)?.value;
  const refresh = request.cookies.get(SESSION_COOKIES.refresh)?.value;
  const token =
    access ??
    (refresh ? (await refreshSession(request, refresh))?.accessToken : null);

  if (token) {
    // Si la API no responde, igual se cierra la sesión local: el usuario
    // pidió salir, y el token vence solo.
    await fetch(upstreamUrl('/v1/auth/logout'), {
      method: 'POST',
      headers: forwardedHeaders(request, token),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response.cookies);
  return response;
}
