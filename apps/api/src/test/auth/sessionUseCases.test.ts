import { describe, expect, it } from 'vitest';
import { AuthenticateRequestUseCase } from '../../modules/auth/application/use-cases/AuthenticateRequestUseCase';
import { LogoutUseCase } from '../../modules/auth/application/use-cases/LogoutUseCase';
import { RefreshSessionUseCase } from '../../modules/auth/application/use-cases/RefreshSessionUseCase';
import { InvalidSessionException } from '../../modules/auth/domain/exceptions/InvalidSessionException';
import { NoAccessException } from '../../modules/auth/domain/exceptions/NoAccessException';
import type { StaffProfile } from '../../modules/auth/domain/StaffProfile';
import { claims, FakeAuthProvider, profile } from '../support/fakeAuthPorts';

function authenticate(
  token: { valid: boolean },
  sessionProfile: StaffProfile | null
): AuthenticateRequestUseCase {
  return new AuthenticateRequestUseCase(
    { verify: async () => (token.valid ? claims() : null) },
    { findProfileBySession: async () => sessionProfile },
    ['angel.hernandez@sabatransporte.com']
  );
}

describe('AuthenticateRequestUseCase', () => {
  it('returns the user of a live session with panel access', async () => {
    const user = await authenticate({ valid: true }, profile()).execute('t');

    expect(user).toEqual({
      id: 'u-1',
      email: 'angel.hernandez@sabatransporte.com',
      name: 'Angel Hernández',
      role: 'admin',
    });
  });

  it('rejects a token that does not verify', async () => {
    await expect(
      authenticate({ valid: false }, profile()).execute('t')
    ).rejects.toThrow(InvalidSessionException);
  });

  it('rejects a token from a closed or revoked session', async () => {
    await expect(
      authenticate({ valid: true }, null).execute('t')
    ).rejects.toThrow(InvalidSessionException);
  });

  it('rejects someone who lost the staff role while the session was open', async () => {
    await expect(
      authenticate({ valid: true }, profile({ role: 'standard' })).execute('t')
    ).rejects.toThrow(NoAccessException);
  });
});

describe('RefreshSessionUseCase', () => {
  it('entrega tokens nuevos', async () => {
    const session = await new RefreshSessionUseCase(
      new FakeAuthProvider()
    ).execute('refresh-valido');

    expect(session.accessToken).toBe('access-u-1');
  });

  it('rejects a refresh token that is no longer valid', async () => {
    await expect(
      new RefreshSessionUseCase(new FakeAuthProvider()).execute('usado')
    ).rejects.toThrow(InvalidSessionException);
  });
});

describe('LogoutUseCase', () => {
  it('revokes the token session', async () => {
    const provider = new FakeAuthProvider();

    await new LogoutUseCase(provider).execute('access-u-1');

    expect(provider.revoked).toEqual(['access-u-1']);
  });
});
