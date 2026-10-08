import type { TStaffRole } from '@repo/schemas';

/** Tokens Supabase Auth issues for a session. */
export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** Seconds since epoch, like the JWT's `exp`. */
  expiresAt: number;
}

/** What the guard leaves on the request once the session is validated. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: TStaffRole;
}
