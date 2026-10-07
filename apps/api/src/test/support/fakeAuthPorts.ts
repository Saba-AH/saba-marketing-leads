import type { AccessTokenClaims } from '../../modules/auth/application/ports/out/AccessTokenVerifierPort';
import type { AuthProviderPort } from '../../modules/auth/application/ports/out/AuthProviderPort';
import type { LoginAttemptsPort } from '../../modules/auth/application/ports/out/LoginAttemptsPort';
import type { AuthSession } from '../../modules/auth/domain/AuthSession';
import type {
  LoginAttempt,
  StaffLockout,
} from '../../modules/auth/domain/loginPolicy';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';

export const AHORA = new Date('2026-10-06T12:00:00.000Z');

export function perfil(overrides: Partial<StaffProfile> = {}): StaffProfile {
  return {
    id: 'u-1',
    correo: 'angel.hernandez@sabatransporte.com',
    nombre: 'Angel',
    apellido: 'Hernández',
    rol: 'admin',
    ...overrides,
  };
}

/** Supabase Auth en memoria: una contraseña por correo. */
export class FakeAuthProvider implements AuthProviderPort {
  readonly revoked: string[] = [];
  private readonly passwords = new Map<
    string,
    { userId: string; pwd: string }
  >();

  register(correo: string, userId: string, pwd: string): void {
    this.passwords.set(correo, { userId, pwd });
  }

  async signIn(
    correo: string,
    contrasena: string
  ): Promise<AuthSession | null> {
    const cuenta = this.passwords.get(correo);
    if (!cuenta || cuenta.pwd !== contrasena) return null;
    return sesion(cuenta.userId);
  }

  async refresh(refreshToken: string): Promise<AuthSession | null> {
    return refreshToken === 'refresh-valido' ? sesion('u-1') : null;
  }

  async revoke(accessToken: string): Promise<void> {
    this.revoked.push(accessToken);
  }
}

export function sesion(userId: string): AuthSession {
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
