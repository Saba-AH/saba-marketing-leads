import { Inject, Injectable } from '@nestjs/common';
import { AccountLockedException } from '../../domain/exceptions/AccountLockedException';
import { InvalidCaptchaException } from '../../domain/exceptions/InvalidCaptchaException';
import { InvalidCredentialsException } from '../../domain/exceptions/InvalidCredentialsException';
import { NoAccessException } from '../../domain/exceptions/NoAccessException';
import { TooManyAttemptsException } from '../../domain/exceptions/TooManyAttemptsException';
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
 * Staff login, ported from Saba's `loginAdmin` (`portalLogin.js`). The
 * delicate part is what gets revealed and when: the lockout and the "no
 * access" are only reported after a correct password, so someone guessing only
 * ever gets "invalid credentials".
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
    private readonly clock: ClockPort,
    @Inject(AUTH_TOKENS.PanelAllowedEmails)
    private readonly allowedEmails: readonly string[]
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    if (!(await this.captcha.verify(command.captchaToken, command.ip))) {
      throw new InvalidCaptchaException();
    }

    const now = this.clock.now();
    const attempt = (fields: Partial<LoginAttempt>): Promise<void> =>
      this.attempts.record({
        email: command.email,
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
        throw new TooManyAttemptsException();
      }
    }

    const profile = await this.staff.findByEmail(command.email);
    const staffProfile = profile && isStaffRole(profile.role) ? profile : null;
    const lockout = staffProfile
      ? await this.attempts.findLockout(staffProfile.id)
      : null;

    const session = await this.auth.signIn(command.email, command.password);

    if (staffProfile && lockout?.lockedAt) {
      await attempt({ userId: staffProfile.id, reason: 'locked' });
      if (!session) throw new InvalidCredentialsException();
      await this.auth.revoke(session.accessToken);
      throw new AccountLockedException();
    }

    if (!session) {
      await attempt({ userId: profile?.id ?? null, reason: 'bad_credentials' });
      if (staffProfile) {
        await this.attempts.saveLockout(
          nextLockout(staffProfile, lockout, now),
          staffProfile.email,
          now
        );
      }
      throw new InvalidCredentialsException();
    }

    // The real owner of the session wins, not the profile that matched by email.
    const owner = await this.staff.findById(session.userId);
    if (!owner || !canEnterPanel(owner, this.allowedEmails)) {
      await this.auth.revoke(session.accessToken);
      await attempt({ userId: session.userId, reason: 'wrong_portal' });
      throw new NoAccessException();
    }

    if (lockout?.failedCount) {
      await this.attempts.resetFailures(owner.id, now);
    }
    await attempt({ userId: owner.id, success: true });

    return { session: session, user: toAuthenticatedUser(owner) };
  }
}
