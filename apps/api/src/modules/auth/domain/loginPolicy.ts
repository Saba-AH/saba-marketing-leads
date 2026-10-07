/**
 * Mismos números que el login de staff de Saba (`portalLogin.js`): las tablas
 * de intentos y bloqueos son compartidas, así que una regla distinta acá
 * haría que el mismo correo se bloquee distinto según por dónde entre.
 */
export const LOGIN_POLICY = {
  rateWindowMs: 15 * 60 * 1000,
  maxFailuresPerIp: 10,
  maxConsecutiveStaffFailures: 5,
} as const;

/** El portal de staff de Saba: este panel cuenta los intentos ahí. */
export const STAFF_PORTAL = 'admin';

/** Valores de `login_attempts.reason` que ya usa Saba. */
export type LoginAttemptReason =
  | 'rate_limited'
  | 'bad_credentials'
  | 'locked'
  | 'wrong_portal';

export interface LoginAttempt {
  correo: string;
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

/** Un fallo más; al llegar al tope la cuenta queda bloqueada hasta que la desbloqueen en Saba. */
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
