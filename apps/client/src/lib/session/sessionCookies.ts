import type { TSesionTokens } from '@repo/schemas';
import type { NextResponse } from 'next/server';

type ResponseCookies = NextResponse['cookies'];

/**
 * Los tokens de Supabase Auth viven solo en estas cookies `httpOnly`: el JS
 * del navegador nunca los ve, así que un XSS no puede llevárselos.
 */
export const SESSION_COOKIES = {
  access: 'saba_session',
  refresh: 'saba_refresh',
} as const;

/**
 * La cookie del access token vence este margen antes que el token: cuando
 * falta, el middleware ya sabe que hay que renovar y no manda a la API un
 * token a punto de expirar.
 */
const REFRESH_MARGIN_S = 60;
const REFRESH_MAX_AGE_S = 30 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

export function writeSessionCookies(
  cookies: ResponseCookies,
  tokens: TSesionTokens,
  nowS: number = Date.now() / 1000
): void {
  const accessMaxAge = Math.max(
    0,
    Math.floor(tokens.expiresAt - nowS - REFRESH_MARGIN_S)
  );
  cookies.set(
    SESSION_COOKIES.access,
    tokens.accessToken,
    cookieOptions(accessMaxAge)
  );
  cookies.set(
    SESSION_COOKIES.refresh,
    tokens.refreshToken,
    cookieOptions(REFRESH_MAX_AGE_S)
  );
}

export function clearSessionCookies(cookies: ResponseCookies): void {
  cookies.delete(SESSION_COOKIES.access);
  cookies.delete(SESSION_COOKIES.refresh);
}
