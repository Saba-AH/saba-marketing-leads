import { STAFF_ROLES, type TStaffRole } from '@repo/schemas';

/** Perfil de Saba (`profiles`) visto desde el login del panel. */
export interface StaffProfile {
  id: string;
  correo: string;
  nombre: string;
  apellido: string;
  /** `profiles.role` tal cual: puede ser de cliente (`standard`) o nulo. */
  rol: string | null;
}

export function isStaffRole(rol: string | null): rol is TStaffRole {
  return rol !== null && (STAFF_ROLES as readonly string[]).includes(rol);
}
