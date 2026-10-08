const LOGIN_PATH = '/login';

/**
 * Where to go back to after login. Internal routes only: a `?next=` with
 * another origin (`//evil.com`, `/\evil.com`, `https://…`) would turn the login
 * into an open redirector.
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
