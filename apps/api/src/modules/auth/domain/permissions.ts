import type { TPermission } from '@repo/schemas';

export interface PermissionRequirement {
  /** `AND` (default): every permission. `OR`: at least one. */
  operator?: 'AND' | 'OR';
  permissions: readonly TPermission[];
}

/**
 * Independent permissions do not form a hierarchy: holding one never grants
 * another, and `AND` asks for all of them.
 */
export function satisfies(
  granted: readonly TPermission[],
  requirement: PermissionRequirement
): boolean {
  const has = (permission: TPermission): boolean =>
    granted.includes(permission);
  return requirement.operator === 'OR'
    ? requirement.permissions.some(has)
    : requirement.permissions.every(has);
}
