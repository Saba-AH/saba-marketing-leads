const LOGIN_PATH = '/login';

/**
 * A dónde volver después del login. Solo rutas internas: un `?next=` con otro
 * origen (`//evil.com`, `/\evil.com`, `https://…`) convertiría al login en un
 * redirector abierto.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/')) return '/';
  if (value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) return '/';
  return value;
}

export function loginPathFor(nextPath: string): string {
  return nextPath === '/'
    ? LOGIN_PATH
    : `${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`;
}
