import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { StaffDirectoryPort } from '../../application/ports/out/StaffDirectoryPort';
import type { StaffProfile } from '../../domain/StaffProfile';
import { staffProfileColumns, toStaffProfile } from './StaffProfileMapper';
import { profiles } from './sabaAuthTables';

@Injectable()
export class DrizzleStaffDirectory implements StaffDirectoryPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async findByEmail(correo: string): Promise<StaffProfile | null> {
    // `profiles.email` no está normalizado en Saba (mayúsculas, espacios), y
    // el builder no trae `lower`/`trim`: comparación cruda parametrizada.
    const [row] = await this.db
      .select(staffProfileColumns)
      .from(profiles)
      .where(sql`lower(trim(${profiles.email})) = ${correo}`)
      .limit(1);
    return row ? toStaffProfile(row) : null;
  }

  async findById(id: string): Promise<StaffProfile | null> {
    const [row] = await this.db
      .select(staffProfileColumns)
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    return row ? toStaffProfile(row) : null;
  }
}
