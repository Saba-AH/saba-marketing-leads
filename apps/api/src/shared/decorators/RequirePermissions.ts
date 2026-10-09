import { SetMetadata } from '@nestjs/common';
import type { PermissionRequirement } from '../../modules/auth/domain/permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Checked by the global `PermissionsGuard` (`modules/auth`) against the
 * permissions Saba resolved for the session. On a method it replaces the one
 * on the controller.
 */
export const RequirePermissions = (
  requirement: PermissionRequirement
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, requirement);
