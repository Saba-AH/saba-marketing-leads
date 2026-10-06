import type { TSesionTokens, TUsuarioSesion } from '@repo/schemas';
import { NextRequest } from 'next/server';

export const API = 'http://localhost:8080/api';
export const PANEL = 'http://localhost:3002';

export const usuario: TUsuarioSesion = {
  id: 'u-1',
  correo: 'angel.hernandez@sabatransporte.com',
  nombre: 'Angel Hernández',
  rol: 'admin',
};

export function tokens(sufijo = '1'): TSesionTokens {
  return {
    accessToken: `access-${sufijo}`,
    refreshToken: `refresh-${sufijo}`,
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
  return new NextRequest(`${PANEL}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** `Set-Cookie` de la respuesta, por nombre. */
export function setCookies(response: Response): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of response.headers.getSetCookie()) {
    const name = header.slice(0, header.indexOf('='));
    map.set(name, header);
  }
  return map;
}
