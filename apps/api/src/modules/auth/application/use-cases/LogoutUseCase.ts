import { Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKENS } from '../../tokens';
import type { LogoutPort } from '../ports/in/LogoutPort';
import type { SabaAuthGatewayPort } from '../ports/out/SabaAuthGatewayPort';
import type { SessionCachePort } from '../ports/out/SessionCachePort';

@Injectable()
export class LogoutUseCase implements LogoutPort {
  constructor(
    @Inject(AUTH_TOKENS.SabaAuthGateway)
    private readonly saba: SabaAuthGatewayPort,
    @Inject(AUTH_TOKENS.SessionCache)
    private readonly cache: SessionCachePort
  ) {}

  async execute(accessToken: string): Promise<void> {
    // First: a closed session must not keep answering from the cache.
    this.cache.delete(accessToken);
    await this.saba.logout(accessToken);
  }
}
