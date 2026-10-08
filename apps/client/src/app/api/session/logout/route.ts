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
 * Ends the session in Supabase too, not only in the browser: deleting the
 * cookies without revoking would leave the refresh token alive until it
 * expires.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();

  const access = request.cookies.get(SESSION_COOKIES.access)?.value;
  const refresh = request.cookies.get(SESSION_COOKIES.refresh)?.value;
  const token =
    access ??
    (refresh ? (await refreshSession(request, refresh))?.accessToken : null);

  if (token) {
    // If the API does not respond, the local session is closed anyway: the user
    // asked to leave, and the token expires on its own.
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
