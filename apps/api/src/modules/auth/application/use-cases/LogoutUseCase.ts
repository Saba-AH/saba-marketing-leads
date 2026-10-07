import { Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKENS } from '../../tokens';
import type { LogoutPort } from '../ports/in/LogoutPort';
import type { AuthProviderPort } from '../ports/out/AuthProviderPort';

@Injectable()
export class LogoutUseCase implements LogoutPort {
  constructor(
    @Inject(AUTH_TOKENS.AuthProvider)
    private readonly auth: AuthProviderPort
  ) {}

  async execute(accessToken: string): Promise<void> {
    await this.auth.revoke(accessToken);
  }
}
