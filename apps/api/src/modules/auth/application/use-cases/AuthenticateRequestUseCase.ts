import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { SesionInvalidaException } from '../../domain/exceptions/SesionInvalidaException';
import { SinAccesoException } from '../../domain/exceptions/SinAccesoException';
import { canEnterPanel } from '../../domain/panelAccess';
import { toAuthenticatedUser } from '../../domain/toAuthenticatedUser';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthenticateRequestPort } from '../ports/in/AuthenticateRequestPort';
import type { AccessTokenVerifierPort } from '../ports/out/AccessTokenVerifierPort';
import type { ActiveSessionReaderPort } from '../ports/out/ActiveSessionReaderPort';

/**
 * Corre en cada petición. La firma del JWT no alcanza: un logout, una sesión
 * revocada o un rol quitado en Saba tienen que aplicar en la petición
 * siguiente, no cuando venza el token.
 */
@Injectable()
export class AuthenticateRequestUseCase implements AuthenticateRequestPort {
  constructor(
    @Inject(AUTH_TOKENS.AccessTokenVerifier)
    private readonly tokens: AccessTokenVerifierPort,
    @Inject(AUTH_TOKENS.ActiveSessionReader)
    private readonly sessions: ActiveSessionReaderPort
  ) {}

  async execute(accessToken: string): Promise<AuthenticatedUser> {
    const claims = await this.tokens.verify(accessToken);
    if (!claims) throw new SesionInvalidaException();

    const profile = await this.sessions.findProfileBySession(
      claims.userId,
      claims.sessionId
    );
    if (!profile) throw new SesionInvalidaException();
    if (!canEnterPanel(profile)) throw new SinAccesoException();

    return toAuthenticatedUser(profile);
  }
}
