import type { Request } from 'express';

const BEARER_PREFIX = 'Bearer ';

/** Used by `AuthGuard` (Supabase Auth) and by logout. */
export function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    return undefined;
  }
  return header.slice(BEARER_PREFIX.length);
}
