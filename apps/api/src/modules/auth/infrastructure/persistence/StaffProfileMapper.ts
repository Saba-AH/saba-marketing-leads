import type { StaffProfile } from '../../domain/StaffProfile';
import { profiles } from './sabaAuthTables';

export const staffProfileColumns = {
  id: profiles.id,
  email: profiles.email,
  nombre: profiles.nombre,
  apellido: profiles.apellido,
  role: profiles.role,
};

export interface StaffProfileRow {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  role: string | null;
}

export function toStaffProfile(row: StaffProfileRow): StaffProfile {
  return {
    id: row.id,
    correo: row.email.trim().toLowerCase(),
    nombre: row.nombre,
    apellido: row.apellido,
    rol: row.role,
  };
}
