import type { TSessionTokens, TSessionUser } from '@repo/schemas';
import { NextRequest } from 'next/server';

export const API = 'http://localhost:8080/api';
export const PANEL_URL = 'http://localhost:3002';

export const user: TSessionUser = {
  id: 'u-1',
  email: 'angel.hernandez@sabatransporte.com',
  name: 'Angel Hernández',
  role: 'admin',
};

export function tokens(suffix = '1'): TSessionTokens {
  return {
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

export function panelRequest(
  path: string,
  init: {
    cookies?: Record<string, string>;
    method?: string;
    body?: unknown;
    origin?: string;
  } = {}
): NextRequest {
  const headers = new Headers({ host: 'localhost:3002' });
  if (init.cookies) {
    headers.set(
      'cookie',
      Object.entries(init.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    );
  }
  if (init.origin) headers.set('origin', init.origin);
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest(`${PANEL_URL}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** The response's `Set-Cookie`, by name. */
export function setCookies(response: Response): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of response.headers.getSetCookie()) {
    const name = header.slice(0, header.indexOf('='));
    map.set(name, header);
  }
  return map;
}
