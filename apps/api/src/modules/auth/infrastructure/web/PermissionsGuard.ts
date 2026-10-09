import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../shared/decorators/RequirePermissions';
import { PermissionDeniedException } from '../../domain/exceptions/PermissionDeniedException';
import {
  type PermissionRequirement,
  satisfies,
} from '../../domain/permissions';
import type { AuthenticatedRequest } from './AuthenticatedRequest';

/** Global, after `AuthGuard`: it reads the user that one left on the request. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<
      PermissionRequirement | undefined
    >(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!requirement) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !satisfies(user.permissions, requirement)) {
      throw new PermissionDeniedException();
    }
    return true;
  }
}
