import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '../../domain/AuthSession';
import { InvalidSessionException } from '../../domain/exceptions/InvalidSessionException';
import { AUTH_TOKENS } from '../../tokens';
import type { RefreshSessionPort } from '../ports/in/RefreshSessionPort';
import type { AuthProviderPort } from '../ports/out/AuthProviderPort';

/**
 * It does not check panel access: the guard does that on the next request with
 * the new token, so the rule lives in a single place.
 */
@Injectable()
export class RefreshSessionUseCase implements RefreshSessionPort {
  constructor(
    @Inject(AUTH_TOKENS.AuthProvider)
    private readonly auth: AuthProviderPort
  ) {}

  async execute(refreshToken: string): Promise<AuthSession> {
    const session = await this.auth.refresh(refreshToken);
    if (!session) throw new InvalidSessionException();
    return session;
  }
}
