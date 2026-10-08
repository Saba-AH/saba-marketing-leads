import type { StaffProfile } from '../../domain/StaffProfile';
import { profiles } from './sabaAuthTables';

export const staffProfileColumns = {
  id: profiles.id,
  email: profiles.email,
  name: profiles.name,
  lastName: profiles.lastName,
  role: profiles.role,
};

export interface StaffProfileRow {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: string | null;
}

export function toStaffProfile(row: StaffProfileRow): StaffProfile {
  return {
    id: row.id,
    email: row.email.trim().toLowerCase(),
    name: row.name,
    lastName: row.lastName,
    role: row.role,
  };
}
