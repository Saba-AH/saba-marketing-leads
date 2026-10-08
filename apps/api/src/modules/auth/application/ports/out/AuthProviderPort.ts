import type { AuthSession } from '../../../domain/AuthSession';

/** Supabase Auth: owner of passwords and sessions. */
export interface AuthProviderPort {
  /** `null` if the credentials are not valid. */
  signIn(email: string, password: string): Promise<AuthSession | null>;
  /** `null` if the refresh token is no longer usable (used, revoked or expired). */
  refresh(refreshToken: string): Promise<AuthSession | null>;
  /** Ends the token's session. Idempotent: an already invalid token does not fail. */
  revoke(accessToken: string): Promise<void>;
}
