import { AUTH_ERROR_CODES } from '@repo/schemas';
import { NextResponse } from 'next/server';
import { clearSessionCookies } from './sessionCookies';

/** Misma forma que los errores de la API, para que el cliente los trate igual. */
export function sessionExpiredResponse(): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Tu sesión expiró. Inicia sesión de nuevo.',
      code: AUTH_ERROR_CODES.sesionInvalida,
    },
    { status: 401 }
  );
  clearSessionCookies(response.cookies);
  return response;
}

export function forbiddenOriginResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Origen no permitido.' },
    { status: 403 }
  );
}
