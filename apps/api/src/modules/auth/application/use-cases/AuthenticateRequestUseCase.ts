import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { InvalidSessionException } from '../../domain/exceptions/InvalidSessionException';
import { NoAccessException } from '../../domain/exceptions/NoAccessException';
import { canEnterPanel } from '../../domain/panelAccess';
import { toAuthenticatedUser } from '../../domain/toAuthenticatedUser';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthenticateRequestPort } from '../ports/in/AuthenticateRequestPort';
import type { AccessTokenVerifierPort } from '../ports/out/AccessTokenVerifierPort';
import type { ActiveSessionReaderPort } from '../ports/out/ActiveSessionReaderPort';

/**
 * Runs on every request. The JWT signature is not enough: a logout, a revoked
 * session or a role removed in Saba must apply on the next request, not when
 * the token expires.
 */
@Injectable()
export class AuthenticateRequestUseCase implements AuthenticateRequestPort {
  constructor(
    @Inject(AUTH_TOKENS.AccessTokenVerifier)
    private readonly tokens: AccessTokenVerifierPort,
    @Inject(AUTH_TOKENS.ActiveSessionReader)
    private readonly sessions: ActiveSessionReaderPort,
    @Inject(AUTH_TOKENS.PanelAllowedEmails)
    private readonly allowedEmails: readonly string[]
  ) {}

  async execute(accessToken: string): Promise<AuthenticatedUser> {
    const claims = await this.tokens.verify(accessToken);
    if (!claims) throw new InvalidSessionException();

    const profile = await this.sessions.findProfileBySession(
      claims.userId,
      claims.sessionId
    );
    if (!profile) throw new InvalidSessionException();
    if (!canEnterPanel(profile, this.allowedEmails)) {
      throw new NoAccessException();
    }

    return toAuthenticatedUser(profile);
  }
}
