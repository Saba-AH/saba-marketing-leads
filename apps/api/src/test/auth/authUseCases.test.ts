import { describe, expect, it, vi } from 'vitest';
import type { SessionCachePort } from '../../modules/auth/application/ports/out/SessionCachePort';
import { AuthenticateRequestUseCase } from '../../modules/auth/application/use-cases/AuthenticateRequestUseCase';
import { LoginUseCase } from '../../modules/auth/application/use-cases/LoginUseCase';
import { LogoutUseCase } from '../../modules/auth/application/use-cases/LogoutUseCase';
import { RefreshSessionUseCase } from '../../modules/auth/application/use-cases/RefreshSessionUseCase';
import type { AuthenticatedUser } from '../../modules/auth/domain/AuthSession';
import { InvalidCaptchaException } from '../../modules/auth/domain/exceptions/InvalidCaptchaException';
import { InvalidSessionException } from '../../modules/auth/domain/exceptions/InvalidSessionException';
import { agent, FakeSabaAuthGateway } from '../support/fakeSabaAuth';

class MapCache implements SessionCachePort {
  readonly entries = new Map<string, AuthenticatedUser>();
  get(token: string): AuthenticatedUser | null {
    return this.entries.get(token) ?? null;
  }
  set(token: string, user: AuthenticatedUser): void {
    this.entries.set(token, user);
  }
  delete(token: string): void {
    this.entries.delete(token);
  }
}

const CLIENT = { ip: '190.1.2.3', userAgent: 'Firefox' };
const COMMAND = {
  email: 'agente@sabatransporte.com',
  password: 'secret',
  captchaToken: 'captcha',
  client: CLIENT,
};

describe('LoginUseCase', () => {
  it('logs in through Saba with the agent IP and user agent', async () => {
    const saba = new FakeSabaAuthGateway();
    const login = vi.spyOn(saba, 'login');

    const result = await new LoginUseCase(
      { verify: async () => true },
      saba
    ).execute(COMMAND);

    expect(login).toHaveBeenCalledWith(
      'agente@sabatransporte.com',
      'secret',
      CLIENT
    );
    expect(result.user.permissions).toEqual(['marketing:access']);
  });

  it('rejects an invalid CAPTCHA without asking Saba', async () => {
    const saba = new FakeSabaAuthGateway();
    const login = vi.spyOn(saba, 'login');

    await expect(
      new LoginUseCase({ verify: async () => false }, saba).execute(COMMAND)
    ).rejects.toThrow(InvalidCaptchaException);
    expect(login).not.toHaveBeenCalled();
  });
});

describe('AuthenticateRequestUseCase', () => {
  it('asks Saba once and answers repeated requests from the cache', async () => {
    const saba = new FakeSabaAuthGateway();
    saba.sessions.set('t', agent());
    const authenticate = new AuthenticateRequestUseCase(saba, new MapCache());

    await authenticate.execute('t');
    const user = await authenticate.execute('t');

    expect(user).toEqual(agent());
    expect(saba.sessionLookups).toBe(1);
  });

  it('does not remember a rejection', async () => {
    const saba = new FakeSabaAuthGateway();
    const authenticate = new AuthenticateRequestUseCase(saba, new MapCache());

    await expect(authenticate.execute('t')).rejects.toThrow(
      InvalidSessionException
    );
    saba.sessions.set('t', agent());

    await expect(authenticate.execute('t')).resolves.toEqual(agent());
  });
});

describe('RefreshSessionUseCase', () => {
  it('hands out new tokens', async () => {
    const session = await new RefreshSessionUseCase(
      new FakeSabaAuthGateway()
    ).execute('refresh-u-1');

    expect(session.accessToken).toBe('access-u-1');
  });

  it('rejects a refresh token that is no longer valid', async () => {
    await expect(
      new RefreshSessionUseCase(new FakeSabaAuthGateway()).execute('used')
    ).rejects.toThrow(InvalidSessionException);
  });
});

describe('LogoutUseCase', () => {
  it('closes the session in Saba and forgets it here', async () => {
    const saba = new FakeSabaAuthGateway();
    const cache = new MapCache();
    cache.set('t', agent());

    await new LogoutUseCase(saba, cache).execute('t');

    expect(saba.loggedOut).toEqual(['t']);
    expect(cache.get('t')).toBeNull();
  });
});
