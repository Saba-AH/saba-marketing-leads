import { refreshSesionResponseSchema, type TSesionTokens } from '@repo/schemas';
import type { NextRequest } from 'next/server';

/**
 * La API de NestJS vista desde el servidor de Next. Variable de runtime (no
 * `NEXT_PUBLIC_*`): el navegador ya no habla con la API, solo con este BFF.
 */
function apiBaseUrl(): string {
  return `${(process.env.API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')}/api`;
}

export function upstreamUrl(pathAndQuery: string): string {
  return `${apiBaseUrl()}${pathAndQuery}`;
}

/**
 * Cabeceras que la API necesita del navegador original. `x-forwarded-for` la
 * completa Next con la IP del socket si no venía; detrás del balanceador de
 * Cloud Run la entrada de más a la derecha es la IP real, que es la que toma
 * la API (`TRUST_PROXY_HOPS`) para el rate limit del login.
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

/** `null` si el refresh token ya no sirve; la sesión hay que darla por cerrada. */
export async function refreshSession(
  request: NextRequest,
  refreshToken: string
): Promise<TSesionTokens | null> {
  const headers = forwardedHeaders(request);
  headers.set('content-type', 'application/json');
  const response = await fetch(upstreamUrl('/v1/auth/refresh'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  const body = refreshSesionResponseSchema.safeParse(
    await response.json().catch(() => null)
  );
  return body.success && body.data.success ? body.data.data : null;
}

/**
 * Defensa extra contra CSRF en los POST del BFF (además de `SameSite=Strict`):
 * un navegador siempre manda `Origin` en un POST, y tiene que ser este sitio.
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
