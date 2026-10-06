import type { LoginAttempt, StaffLockout } from '../../../domain/loginPolicy';

/** Intentos y bloqueos del portal de staff, compartidos con Saba. */
export interface LoginAttemptsPort {
  /** Fallos desde `since` para la IP, sin contar los rechazos del propio límite. */
  countRecentIpFailures(ip: string, since: Date): Promise<number>;
  record(attempt: LoginAttempt): Promise<void>;
  findLockout(userId: string): Promise<StaffLockout | null>;
  saveLockout(lockout: StaffLockout, correo: string, now: Date): Promise<void>;
  /** Vuelve el contador a cero, salvo que la cuenta ya esté bloqueada. */
  resetFailures(userId: string, now: Date): Promise<void>;
}
