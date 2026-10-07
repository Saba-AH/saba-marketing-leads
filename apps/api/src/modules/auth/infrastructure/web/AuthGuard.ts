import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../../shared/decorators/Public';
import { extractBearerToken } from '../../../../shared/http/extractBearerToken';
import type { AuthenticateRequestPort } from '../../application/ports/in/AuthenticateRequestPort';
import { SesionInvalidaException } from '../../domain/exceptions/SesionInvalidaException';
import { AUTH_TOKENS } from '../../tokens';
import type { AuthenticatedRequest } from './AuthenticatedRequest';

/** Global: toda ruta exige sesión salvo las marcadas con `@Public()`. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_TOKENS.AuthenticateRequest)
    private readonly authenticate: AuthenticateRequestPort
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    if (!token) throw new SesionInvalidaException();

    request.user = await this.authenticate.execute(token);
    return true;
  }
}
