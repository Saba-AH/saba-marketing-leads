import type { LoginAttempt, StaffLockout } from '../../../domain/loginPolicy';

/** Staff portal attempts and lockouts, shared with Saba. */
export interface LoginAttemptsPort {
  /** Failures since `since` for the IP, not counting the limit's own rejections. */
  countRecentIpFailures(ip: string, since: Date): Promise<number>;
  record(attempt: LoginAttempt): Promise<void>;
  findLockout(userId: string): Promise<StaffLockout | null>;
  saveLockout(lockout: StaffLockout, email: string, now: Date): Promise<void>;
  /** Resets the counter to zero, unless the account is already locked. */
  resetFailures(userId: string, now: Date): Promise<void>;
}
