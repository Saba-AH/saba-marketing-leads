import type { AuthenticatedUser } from '../../../domain/AuthSession';

/**
 * Asking Saba on every request would put it in the path of every click. The
 * cache is short-lived: a permission removed in Saba applies within its TTL.
 */
export interface SessionCachePort {
  get(accessToken: string): AuthenticatedUser | null;
  set(accessToken: string, user: AuthenticatedUser): void;
  delete(accessToken: string): void;
}
