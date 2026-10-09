import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthenticateRequestPort } from '../ports/in/AuthenticateRequestPort';
import type { SabaAuthGatewayPort } from '../ports/out/SabaAuthGatewayPort';
import type { SessionCachePort } from '../ports/out/SessionCachePort';

/**
 * Runs on every request. Saba decides whether the session is alive and what
 * it may do; only successful answers are cached, so a rejection is never
 * remembered and a fixed account gets in on its next try.
 */
@Injectable()
export class AuthenticateRequestUseCase implements AuthenticateRequestPort {
  constructor(
    @Inject(AUTH_TOKENS.SabaAuthGateway)
    private readonly saba: SabaAuthGatewayPort,
    @Inject(AUTH_TOKENS.SessionCache)
    private readonly cache: SessionCachePort
  ) {}

  async execute(accessToken: string): Promise<AuthenticatedUser> {
    const cached = this.cache.get(accessToken);
    if (cached) return cached;

    const user = await this.saba.findSessionUser(accessToken);
    this.cache.set(accessToken, user);
    return user;
  }
}
