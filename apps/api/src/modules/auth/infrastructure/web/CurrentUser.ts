import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { SesionInvalidaException } from '../../domain/exceptions/SesionInvalidaException';
import type { AuthenticatedRequest } from './AuthenticatedRequest';

/** El usuario que dejó `AuthGuard`. En una ruta `@Public()` no hay usuario. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new SesionInvalidaException();
    return user;
  }
);
