import type { AccessTokenClaims } from '../../modules/auth/application/ports/out/AccessTokenVerifierPort';
import type { AuthProviderPort } from '../../modules/auth/application/ports/out/AuthProviderPort';
import type { LoginAttemptsPort } from '../../modules/auth/application/ports/out/LoginAttemptsPort';
import type { AuthSession } from '../../modules/auth/domain/AuthSession';
import type {
  LoginAttempt,
  StaffLockout,
} from '../../modules/auth/domain/loginPolicy';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';

export const NOW = new Date('2026-10-06T12:00:00.000Z');

export function profile(overrides: Partial<StaffProfile> = {}): StaffProfile {
  return {
    id: 'u-1',
    email: 'angel.hernandez@sabatransporte.com',
    name: 'Angel',
    lastName: 'Hernández',
    role: 'admin',
    ...overrides,
  };
}

/** In-memory Supabase Auth: one password per email. */
export class FakeAuthProvider implements AuthProviderPort {
  readonly revoked: string[] = [];
  private readonly passwords = new Map<
    string,
    { userId: string; pwd: string }
  >();

  register(email: string, userId: string, pwd: string): void {
    this.passwords.set(email, { userId, pwd });
  }

  async signIn(email: string, password: string): Promise<AuthSession | null> {
    const account = this.passwords.get(email);
    if (!account || account.pwd !== password) return null;
    return session(account.userId);
  }

  async refresh(refreshToken: string): Promise<AuthSession | null> {
    return refreshToken === 'refresh-valido' ? session('u-1') : null;
  }

  async revoke(accessToken: string): Promise<void> {
    this.revoked.push(accessToken);
  }
}

export function session(userId: string): AuthSession {
  return {
    userId,
    accessToken: `access-${userId}`,
    refreshToken: `refresh-${userId}`,
    expiresAt: 1_791_400_000,
  };
}

export class FakeLoginAttempts implements LoginAttemptsPort {
  readonly attempts: LoginAttempt[] = [];
  readonly lockouts = new Map<string, StaffLockout>();
  ipFailures = 0;

  async countRecentIpFailures(): Promise<number> {
    return this.ipFailures;
  }

  async record(attempt: LoginAttempt): Promise<void> {
    this.attempts.push(attempt);
  }

  async findLockout(userId: string): Promise<StaffLockout | null> {
    return this.lockouts.get(userId) ?? null;
  }

  async saveLockout(lockout: StaffLockout): Promise<void> {
    this.lockouts.set(lockout.userId, lockout);
  }

  async resetFailures(userId: string): Promise<void> {
    const actual = this.lockouts.get(userId);
    if (actual && !actual.lockedAt) {
      this.lockouts.set(userId, { ...actual, failedCount: 0 });
    }
  }
}

export function claims(
  overrides: Partial<AccessTokenClaims> = {}
): AccessTokenClaims {
  return { userId: 'u-1', sessionId: 's-1', ...overrides };
}
