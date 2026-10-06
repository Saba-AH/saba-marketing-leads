import { Inject, Injectable } from '@nestjs/common';
import { CaptchaInvalidoException } from '../../domain/exceptions/CaptchaInvalidoException';
import { CredencialesInvalidasException } from '../../domain/exceptions/CredencialesInvalidasException';
import { CuentaBloqueadaException } from '../../domain/exceptions/CuentaBloqueadaException';
import { DemasiadosIntentosException } from '../../domain/exceptions/DemasiadosIntentosException';
import { SinAccesoException } from '../../domain/exceptions/SinAccesoException';
import {
  LOGIN_POLICY,
  type LoginAttempt,
  nextLockout,
} from '../../domain/loginPolicy';
import { canEnterPanel } from '../../domain/panelAccess';
import { isStaffRole } from '../../domain/StaffProfile';
import { toAuthenticatedUser } from '../../domain/toAuthenticatedUser';
import { AUTH_TOKENS } from '../../tokens';
import type {
  LoginCommand,
  LoginPort,
  LoginResult,
} from '../ports/in/LoginPort';
import type { AuthProviderPort } from '../ports/out/AuthProviderPort';
import type { CaptchaVerifierPort } from '../ports/out/CaptchaVerifierPort';
import type { ClockPort } from '../ports/out/ClockPort';
import type { LoginAttemptsPort } from '../ports/out/LoginAttemptsPort';
import type { StaffDirectoryPort } from '../ports/out/StaffDirectoryPort';

/**
 * Login de staff, portado de `loginAdmin` de Saba (`portalLogin.js`). Lo
 * delicado es qué se revela y cuándo: el bloqueo y el "sin acceso" solo se
 * informan después de una contraseña correcta, así que a quien adivina solo le
 * llega "credenciales inválidas".
 */
@Injectable()
export class LoginUseCase implements LoginPort {
  constructor(
    @Inject(AUTH_TOKENS.AuthProvider)
    private readonly auth: AuthProviderPort,
    @Inject(AUTH_TOKENS.CaptchaVerifier)
    private readonly captcha: CaptchaVerifierPort,
    @Inject(AUTH_TOKENS.StaffDirectory)
    private readonly staff: StaffDirectoryPort,
    @Inject(AUTH_TOKENS.LoginAttempts)
    private readonly attempts: LoginAttemptsPort,
    @Inject(AUTH_TOKENS.Clock)
    private readonly clock: ClockPort
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    if (!(await this.captcha.verify(command.captchaToken, command.ip))) {
      throw new CaptchaInvalidoException();
    }

    const now = this.clock.now();
    const attempt = (fields: Partial<LoginAttempt>): Promise<void> =>
      this.attempts.record({
        correo: command.correo,
        userId: null,
        ip: command.ip,
        userAgent: command.userAgent,
        success: false,
        reason: null,
        ...fields,
      });

    if (command.ip) {
      const since = new Date(now.getTime() - LOGIN_POLICY.rateWindowMs);
      const failures = await this.attempts.countRecentIpFailures(
        command.ip,
        since
      );
      if (failures >= LOGIN_POLICY.maxFailuresPerIp) {
        await attempt({ reason: 'rate_limited' });
        throw new DemasiadosIntentosException();
      }
    }

    const profile = await this.staff.findByEmail(command.correo);
    const staffProfile = profile && isStaffRole(profile.rol) ? profile : null;
    const lockout = staffProfile
      ? await this.attempts.findLockout(staffProfile.id)
      : null;

    const session = await this.auth.signIn(command.correo, command.contrasena);

    if (staffProfile && lockout?.lockedAt) {
      await attempt({ userId: staffProfile.id, reason: 'locked' });
      if (!session) throw new CredencialesInvalidasException();
      await this.auth.revoke(session.accessToken);
      throw new CuentaBloqueadaException();
    }

    if (!session) {
      await attempt({ userId: profile?.id ?? null, reason: 'bad_credentials' });
      if (staffProfile) {
        await this.attempts.saveLockout(
          nextLockout(staffProfile, lockout, now),
          staffProfile.correo,
          now
        );
      }
      throw new CredencialesInvalidasException();
    }

    // El dueño real de la sesión manda, no el perfil que coincidió por correo.
    const owner = await this.staff.findById(session.userId);
    if (!owner || !canEnterPanel(owner)) {
      await this.auth.revoke(session.accessToken);
      await attempt({ userId: session.userId, reason: 'wrong_portal' });
      throw new SinAccesoException();
    }

    if (lockout?.failedCount) {
      await this.attempts.resetFailures(owner.id, now);
    }
    await attempt({ userId: owner.id, success: true });

    return { sesion: session, usuario: toAuthenticatedUser(owner) };
  }
}
