import type { Request } from 'express';

const BEARER_PREFIX = 'Bearer ';

/** Used by `AuthGuard`, by logout and to forward the agent's session to Saba. */
export function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    return undefined;
  }
  return header.slice(BEARER_PREFIX.length);
}
