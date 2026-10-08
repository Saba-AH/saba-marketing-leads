import { STAFF_ROLES, type TStaffRole } from '@repo/schemas';

/** Saba profile (`profiles`) as seen from the panel login. */
export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  /** `profiles.role` as-is: it can be a customer one (`standard`) or null. */
  role: string | null;
}

export function isStaffRole(role: string | null): role is TStaffRole {
  return role !== null && (STAFF_ROLES as readonly string[]).includes(role);
}
