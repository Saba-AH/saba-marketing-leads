import { type NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookies,
  SESSION_COOKIES,
} from '@/lib/session/sessionCookies';
import {
  forbiddenOriginResponse,
  sessionExpiredResponse,
} from '@/lib/session/sessionErrors';
import {
  forwardedHeaders,
  isSameOrigin,
  upstreamUrl,
} from '@/lib/session/upstream';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const BODYLESS_METHODS = new Set(['GET', 'HEAD']);

/**
 * `/api/backend/v1/...` → API con el token de la cookie. Sin lógica de
 * negocio: solo pone el `Authorization` que el navegador no puede ver.
 * `v1/auth/*` no pasa: login y refresh devuelven tokens, y esos solo los
 * maneja el BFF.
 */
function isProxiable(path: string[]): boolean {
  if (path[0] !== 'v1' || path[1] === 'auth') return false;
  return path.every((segment) => segment !== '.' && segment !== '..');
}

async function proxy(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  if (!isProxiable(path)) {
    return NextResponse.json(
      { success: false, error: 'No encontrado.' },
      { status: 404 }
    );
  }
  if (!BODYLESS_METHODS.has(request.method) && !isSameOrigin(request)) {
    return forbiddenOriginResponse();
  }

  // El middleware ya renovó el access token si hacía falta.
  const token = request.cookies.get(SESSION_COOKIES.access)?.value;
  if (!token) return sessionExpiredResponse();

  const target = `/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const upstream = await fetch(upstreamUrl(target), {
    method: request.method,
    headers: forwardedHeaders(request, token),
    body: BODYLESS_METHODS.has(request.method)
      ? undefined
      : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
  });

  const response = new NextResponse(
    upstream.status === 204 ? null : upstream.body,
    {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
      },
    }
  );
  if (upstream.status === 401) clearSessionCookies(response.cookies);
  return response;
}

export {
  proxy as DELETE,
  proxy as GET,
  proxy as PATCH,
  proxy as POST,
  proxy as PUT,
};
