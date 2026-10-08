import { beforeEach, describe, expect, it } from 'vitest';
import type { LoginCommand } from '../../modules/auth/application/ports/in/LoginPort';
import { LoginUseCase } from '../../modules/auth/application/use-cases/LoginUseCase';
import { AccountLockedException } from '../../modules/auth/domain/exceptions/AccountLockedException';
import { InvalidCaptchaException } from '../../modules/auth/domain/exceptions/InvalidCaptchaException';
import { InvalidCredentialsException } from '../../modules/auth/domain/exceptions/InvalidCredentialsException';
import { NoAccessException } from '../../modules/auth/domain/exceptions/NoAccessException';
import { TooManyAttemptsException } from '../../modules/auth/domain/exceptions/TooManyAttemptsException';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';
import {
  FakeAuthProvider,
  FakeLoginAttempts,
  NOW,
  profile,
} from '../support/fakeAuthPorts';

const EMAIL = 'angel.hernandez@sabatransporte.com';

function command(overrides: Partial<LoginCommand> = {}): LoginCommand {
  return {
    email: EMAIL,
    password: 'correcta',
    captchaToken: 'captcha-ok',
    ip: '10.0.0.1',
    userAgent: 'jest',
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  let provider: FakeAuthProvider;
  let attempts: FakeLoginAttempts;
  let profiles: StaffProfile[];
  let captchaOk: boolean;
  let useCase: LoginUseCase;

  beforeEach(() => {
    provider = new FakeAuthProvider();
    attempts = new FakeLoginAttempts();
    profiles = [profile()];
    captchaOk = true;
    provider.register(EMAIL, 'u-1', 'correcta');

    useCase = new LoginUseCase(
      provider,
      { verify: async () => captchaOk },
      {
        findByEmail: async (email) =>
          profiles.find((p) => p.email === email) ?? null,
        findById: async (id) => profiles.find((p) => p.id === id) ?? null,
      },
      attempts,
      { now: () => NOW },
      [EMAIL]
    );
  });

  it('returns the session and the user when everything checks out', async () => {
    const result = await useCase.execute(command());

    expect(result.session.accessToken).toBe('access-u-1');
    expect(result.user).toEqual({
      id: 'u-1',
      email: EMAIL,
      name: 'Angel Hernández',
      role: 'admin',
    });
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: true, userId: 'u-1', reason: null }),
    ]);
  });

  it('rejects an invalid CAPTCHA without touching the credentials', async () => {
    captchaOk = false;

    await expect(useCase.execute(command())).rejects.toThrow(
      InvalidCaptchaException
    );
    expect(attempts.attempts).toEqual([]);
  });

  it('cuts off by rate limit when the IP piles up 10 failures', async () => {
    attempts.ipFailures = 10;

    await expect(useCase.execute(command())).rejects.toThrow(
      TooManyAttemptsException
    );
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: false, reason: 'rate_limited' }),
    ]);
  });

  it('counts the failure of a staff member with a wrong password', async () => {
    await expect(
      useCase.execute(command({ password: 'mala' }))
    ).rejects.toThrow(InvalidCredentialsException);

    expect(attempts.lockouts.get('u-1')).toEqual({
      userId: 'u-1',
      failedCount: 1,
      lockedAt: null,
    });
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ reason: 'bad_credentials', userId: 'u-1' }),
    ]);
  });

  it('locks the account on the fifth consecutive failure', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 4,
      lockedAt: null,
    });

    await expect(
      useCase.execute(command({ password: 'mala' }))
    ).rejects.toThrow(InvalidCredentialsException);

    expect(attempts.lockouts.get('u-1')).toEqual({
      userId: 'u-1',
      failedCount: 5,
      lockedAt: NOW,
    });
  });

  it('only reveals the lockout if the password was correct, and ends that session', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 5,
      lockedAt: NOW,
    });

    await expect(useCase.execute(command())).rejects.toThrow(
      AccountLockedException
    );
    expect(provider.revoked).toEqual(['access-u-1']);

    await expect(
      useCase.execute(command({ password: 'mala' }))
    ).rejects.toThrow(InvalidCredentialsException);
    expect(attempts.attempts.map((a) => a.reason)).toEqual([
      'locked',
      'locked',
    ]);
  });

  it('keeps no counter for emails that are not staff', async () => {
    profiles = [];

    await expect(
      useCase.execute(command({ email: 'nadie@x.com', password: 'mala' }))
    ).rejects.toThrow(InvalidCredentialsException);
    expect(attempts.lockouts.size).toBe(0);
  });

  it('rejects a customer with a correct password and ends their session', async () => {
    profiles = [profile({ role: 'standard' })];

    await expect(useCase.execute(command())).rejects.toThrow(NoAccessException);
    expect(provider.revoked).toEqual(['access-u-1']);
    expect(attempts.attempts).toEqual([
      expect.objectContaining({ success: false, reason: 'wrong_portal' }),
    ]);
  });

  it('rejects a staff member who is not on the panel list', async () => {
    const other = 'cajero@sabatransporte.com';
    profiles = [profile({ id: 'u-2', email: other, role: 'cajero' })];
    provider.register(other, 'u-2', 'correcta');

    await expect(useCase.execute(command({ email: other }))).rejects.toThrow(
      NoAccessException
    );
    expect(provider.revoked).toEqual(['access-u-2']);
  });

  it('resets the failure counter on a successful login', async () => {
    attempts.lockouts.set('u-1', {
      userId: 'u-1',
      failedCount: 3,
      lockedAt: null,
    });

    await useCase.execute(command());

    expect(attempts.lockouts.get('u-1')?.failedCount).toBe(0);
  });
});
