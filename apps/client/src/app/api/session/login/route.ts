import { loginResponseSchema, loginSchema } from '@repo/schemas';
import { type NextRequest, NextResponse } from 'next/server';
import { writeSessionCookies } from '@/lib/session/sessionCookies';
import { forbiddenOriginResponse } from '@/lib/session/sessionErrors';
import {
  forwardedHeaders,
  isSameOrigin,
  upstreamUrl,
} from '@/lib/session/upstream';

/**
 * Panel login: forwards to the API and stores the tokens in `httpOnly`
 * cookies. Only the user goes back to the browser, never the tokens.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();

  const body = loginSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { success: false, error: 'Revisa el correo y la contraseña.' },
      { status: 400 }
    );
  }

  const headers = forwardedHeaders(request);
  headers.set('content-type', 'application/json');
  const upstream = await fetch(upstreamUrl('/v1/auth/login'), {
    method: 'POST',
    headers,
    body: JSON.stringify(body.data),
    cache: 'no-store',
  });

  const result = loginResponseSchema.safeParse(
    await upstream.json().catch(() => null)
  );
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: 'No se pudo iniciar sesión. Intenta de nuevo.' },
      { status: 502 }
    );
  }
  if (!result.data.success) {
    return NextResponse.json(result.data, { status: upstream.status });
  }

  const response = NextResponse.json({
    success: true,
    data: { user: result.data.data.user },
  });
  writeSessionCookies(response.cookies, result.data.data.session);
  return response;
}
