import type { TSessionTokens } from '@repo/schemas';
import type { NextResponse } from 'next/server';

type ResponseCookies = NextResponse['cookies'];

/**
 * Supabase Auth tokens live only in these `httpOnly` cookies: the browser's JS
 * never sees them, so an XSS cannot steal them.
 */
export const SESSION_COOKIES = {
  access: 'saba_session',
  refresh: 'saba_refresh',
} as const;

/**
 * The access token cookie expires this margin before the token: when it is
 * missing, the middleware already knows it has to renew and does not send the
 * API a token about to expire.
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
  tokens: TSessionTokens,
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
