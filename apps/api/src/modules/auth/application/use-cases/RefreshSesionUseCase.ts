import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '../../domain/AuthSession';
import { SesionInvalidaException } from '../../domain/exceptions/SesionInvalidaException';
import { AUTH_TOKENS } from '../../tokens';
import type { RefreshSesionPort } from '../ports/in/RefreshSesionPort';
import type { AuthProviderPort } from '../ports/out/AuthProviderPort';

/**
 * No revisa el acceso al panel: lo hace el guard en la petición siguiente con
 * el token nuevo, y así la regla vive en un solo lugar.
 */
@Injectable()
export class RefreshSesionUseCase implements RefreshSesionPort {
  constructor(
    @Inject(AUTH_TOKENS.AuthProvider)
    private readonly auth: AuthProviderPort
  ) {}

  async execute(refreshToken: string): Promise<AuthSession> {
    const session = await this.auth.refresh(refreshToken);
    if (!session) throw new SesionInvalidaException();
    return session;
  }
}
