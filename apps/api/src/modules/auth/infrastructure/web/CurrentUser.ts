import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { InvalidSessionException } from '../../domain/exceptions/InvalidSessionException';
import type { AuthenticatedRequest } from './AuthenticatedRequest';

/** The user `AuthGuard` left. On a `@Public()` route there is no user. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new InvalidSessionException();
    return user;
  }
);
