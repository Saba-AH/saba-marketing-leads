/**
 * Same numbers as Saba's staff login (`portalLogin.js`): the attempts and
 * lockouts tables are shared, so a different rule here would lock the same
 * email differently depending on where it comes in.
 */
export const LOGIN_POLICY = {
  rateWindowMs: 15 * 60 * 1000,
  maxFailuresPerIp: 10,
  maxConsecutiveStaffFailures: 5,
} as const;

/** Saba's staff portal: this panel counts the attempts there. */
export const STAFF_PORTAL = 'admin';

/** `login_attempts.reason` values Saba already uses. */
export type LoginAttemptReason =
  | 'rate_limited'
  | 'bad_credentials'
  | 'locked'
  | 'wrong_portal';

export interface LoginAttempt {
  email: string;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  reason: LoginAttemptReason | null;
}

export interface StaffLockout {
  userId: string;
  failedCount: number;
  lockedAt: Date | null;
}

/** One more failure; on reaching the limit the account stays locked until it is unlocked in Saba. */
export function nextLockout(
  profile: { id: string },
  current: StaffLockout | null,
  now: Date
): StaffLockout {
  const failedCount = (current?.failedCount ?? 0) + 1;
  const reachedLimit = failedCount >= LOGIN_POLICY.maxConsecutiveStaffFailures;
  return {
    userId: profile.id,
    failedCount,
    lockedAt: current?.lockedAt ?? (reachedLimit ? now : null),
  };
}
