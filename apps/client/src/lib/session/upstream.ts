import {
  refreshSessionResponseSchema,
  type TSessionTokens,
} from '@repo/schemas';
import type { NextRequest } from 'next/server';

/**
 * The NestJS API as seen from the Next server. Runtime variable (not
 * `NEXT_PUBLIC_*`): the browser no longer talks to the API, only to this BFF.
 */
function apiBaseUrl(): string {
  return `${(process.env.API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')}/api`;
}

export function upstreamUrl(pathAndQuery: string): string {
  return `${apiBaseUrl()}${pathAndQuery}`;
}

/**
 * Headers the API needs from the original browser. Next fills in
 * `x-forwarded-for` with the socket IP if it was missing; behind Cloud Run's
 * load balancer the rightmost entry is the real IP, which is the one the API
 * takes (`TRUST_PROXY_HOPS`) for the login rate limit.
 */
export function forwardedHeaders(
  request: NextRequest,
  accessToken?: string
): Headers {
  const headers = new Headers();
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  const userAgent = request.headers.get('user-agent');
  if (userAgent) headers.set('user-agent', userAgent);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  return headers;
}

/** `null` if the refresh token is no longer valid; the session must be treated as closed. */
export async function refreshSession(
  request: NextRequest,
  refreshToken: string
): Promise<TSessionTokens | null> {
  const headers = forwardedHeaders(request);
  headers.set('content-type', 'application/json');
  const response = await fetch(upstreamUrl('/v1/auth/refresh'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  const body = refreshSessionResponseSchema.safeParse(
    await response.json().catch(() => null)
  );
  return body.success && body.data.success ? body.data.data : null;
}

/**
 * Extra CSRF defense on the BFF's POSTs (on top of `SameSite=Strict`): a
 * browser always sends `Origin` on a POST, and it has to be this site.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
