import type { StaffProfile } from '../../../domain/StaffProfile';

/** Saba profiles (`profiles`), read only. */
export interface StaffDirectoryPort {
  findByEmail(email: string): Promise<StaffProfile | null>;
  findById(id: string): Promise<StaffProfile | null>;
}
