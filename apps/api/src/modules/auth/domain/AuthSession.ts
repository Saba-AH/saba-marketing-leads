import type { TPermission, TStaffRole } from '@repo/schemas';

/** Tokens of the agent's Saba session (Saba's Supabase Auth issues them). */
export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** Seconds since epoch, like the JWT's `exp`. */
  expiresAt: number;
}

/** What the guard leaves on the request once Saba validated the session. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: TStaffRole;
  /** Granted by Saba; resolved again on every request (see `SessionCachePort`). */
  permissions: TPermission[];
}
