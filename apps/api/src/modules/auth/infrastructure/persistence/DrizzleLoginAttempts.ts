import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNull, ne, or } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { LoginAttemptsPort } from '../../application/ports/out/LoginAttemptsPort';
import {
  type LoginAttempt,
  STAFF_PORTAL,
  type StaffLockout,
} from '../../domain/loginPolicy';
import { adminLoginLockouts, loginAttempts } from './sabaAuthTables';

@Injectable()
export class DrizzleLoginAttempts implements LoginAttemptsPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async countRecentIpFailures(ip: string, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.portal, STAFF_PORTAL),
          eq(loginAttempts.ip, ip),
          eq(loginAttempts.success, false),
          // Los rechazos del propio límite no cuentan: reintentar alargaría el bloqueo.
          or(
            isNull(loginAttempts.reason),
            ne(loginAttempts.reason, 'rate_limited')
          ),
          gte(loginAttempts.createdAt, since)
        )
      );
    return row?.total ?? 0;
  }

  async record(attempt: LoginAttempt): Promise<void> {
    await this.db.insert(loginAttempts).values({
      portal: STAFF_PORTAL,
      email: attempt.correo,
      userId: attempt.userId,
      ip: attempt.ip,
      userAgent: attempt.userAgent?.slice(0, 500) ?? null,
      success: attempt.success,
      reason: attempt.reason,
    });
  }

  async findLockout(userId: string): Promise<StaffLockout | null> {
    const [row] = await this.db
      .select({
        userId: adminLoginLockouts.userId,
        failedCount: adminLoginLockouts.failedCount,
        lockedAt: adminLoginLockouts.lockedAt,
      })
      .from(adminLoginLockouts)
      .where(eq(adminLoginLockouts.userId, userId))
      .limit(1);
    return row ?? null;
  }

  async saveLockout(
    lockout: StaffLockout,
    correo: string,
    now: Date
  ): Promise<void> {
    const values = {
      email: correo,
      failedCount: lockout.failedCount,
      lockedAt: lockout.lockedAt,
      updatedAt: now,
    };
    await this.db
      .insert(adminLoginLockouts)
      .values({ userId: lockout.userId, ...values })
      .onConflictDoUpdate({ target: adminLoginLockouts.userId, set: values });
  }

  async resetFailures(userId: string, now: Date): Promise<void> {
    await this.db
      .update(adminLoginLockouts)
      .set({ failedCount: 0, updatedAt: now })
      .where(
        and(
          eq(adminLoginLockouts.userId, userId),
          isNull(adminLoginLockouts.lockedAt)
        )
      );
  }
}
