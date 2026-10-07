import type { StaffProfile } from '../../../domain/StaffProfile';

/** Perfiles de Saba (`profiles`), solo lectura. */
export interface StaffDirectoryPort {
  findByEmail(correo: string): Promise<StaffProfile | null>;
  findById(id: string): Promise<StaffProfile | null>;
}
