import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { ActiveSessionReaderPort } from '../../application/ports/out/ActiveSessionReaderPort';
import type { StaffProfile } from '../../domain/StaffProfile';
import { staffProfileColumns, toStaffProfile } from './StaffProfileMapper';
import { authSessions, profiles } from './sabaAuthTables';

@Injectable()
export class DrizzleActiveSessionReader implements ActiveSessionReaderPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async findProfileBySession(
    userId: string,
    sessionId: string
  ): Promise<StaffProfile | null> {
    const [row] = await this.db
      .select(staffProfileColumns)
      .from(authSessions)
      .innerJoin(profiles, eq(profiles.id, authSessions.userId))
      .where(
        and(
          eq(authSessions.id, sessionId),
          eq(authSessions.userId, userId),
          or(
            isNull(authSessions.notAfter),
            gt(authSessions.notAfter, sql`now()`)
          )
        )
      )
      .limit(1);
    return row ? toStaffProfile(row) : null;
  }
}
