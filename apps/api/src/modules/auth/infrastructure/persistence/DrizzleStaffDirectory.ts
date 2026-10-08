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

  async findByEmail(email: string): Promise<StaffProfile | null> {
    // `profiles.email` is not normalized in Saba (uppercase, spaces), and the
    // builder has no `lower`/`trim`: parameterized raw comparison.
    const [row] = await this.db
      .select(staffProfileColumns)
      .from(profiles)
      .where(sql`lower(trim(${profiles.email})) = ${email}`)
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
