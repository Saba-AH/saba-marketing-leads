import { sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleLoginAttempts } from '../../modules/auth/infrastructure/persistence/DrizzleLoginAttempts';
import { DrizzleStaffDirectory } from '../../modules/auth/infrastructure/persistence/DrizzleStaffDirectory';
import { closeTestDb, getTestDb, resetDatabase } from '../support/testDatabase';

const USER = '11111111-1111-1111-1111-111111111111';
const NOW = new Date('2026-10-06T12:00:00.000Z');
const ONE_HOUR_AGO = new Date('2026-10-06T11:00:00.000Z');

afterAll(async () => {
  await closeTestDb();
});

describe('DrizzleLoginAttempts (contra Postgres)', () => {
  const attempts = new DrizzleLoginAttempts(getTestDb());

  beforeEach(async () => {
    await resetDatabase();
  });

  async function failure(
    reason: 'bad_credentials' | 'rate_limited',
    ip = '10.0.0.1'
  ): Promise<void> {
    await attempts.record({
      email: 'x@y.com',
      userId: null,
      ip,
      userAgent: null,
      success: false,
      reason,
    });
  }

  it('counts the IP recent failures without counting the limit own ones', async () => {
    await failure('bad_credentials');
    await failure('bad_credentials');
    await failure('rate_limited');
    await failure('bad_credentials', '10.0.0.2');
    await getTestDb().execute(
      sql`UPDATE login_attempts SET created_at = ${ONE_HOUR_AGO.toISOString()} WHERE ip = '10.0.0.2'`
    );

    const from = new Date(Date.now() - 15 * 60 * 1000);
    expect(await attempts.countRecentIpFailures('10.0.0.1', from)).toBe(2);
    expect(await attempts.countRecentIpFailures('10.0.0.2', from)).toBe(0);
  });

  it('saves, updates and resets the lockout counter', async () => {
    expect(await attempts.findLockout(USER)).toBeNull();

    await attempts.saveLockout(
      { userId: USER, failedCount: 1, lockedAt: null },
      'staff@saba.com',
      NOW
    );
    await attempts.saveLockout(
      { userId: USER, failedCount: 2, lockedAt: null },
      'staff@saba.com',
      NOW
    );
    expect(await attempts.findLockout(USER)).toEqual({
      userId: USER,
      failedCount: 2,
      lockedAt: null,
    });

    await attempts.resetFailures(USER, NOW);
    expect((await attempts.findLockout(USER))?.failedCount).toBe(0);
  });

  it('does not reset a locked account: that is done from Saba', async () => {
    await attempts.saveLockout(
      { userId: USER, failedCount: 5, lockedAt: NOW },
      'staff@saba.com',
      NOW
    );

    await attempts.resetFailures(USER, NOW);

    expect(await attempts.findLockout(USER)).toEqual({
      userId: USER,
      failedCount: 5,
      lockedAt: NOW,
    });
  });
});

describe('DrizzleStaffDirectory (contra Postgres)', () => {
  const directory = new DrizzleStaffDirectory(getTestDb());

  beforeEach(async () => {
    await resetDatabase();
    await getTestDb().execute(sql`
      INSERT INTO profiles (id, nombre, apellido, email, role)
      VALUES (${USER}, 'Ana', 'Pérez', '  Ana.Perez@Saba.com ', 'cajero')
    `);
  });

  it('finds the profile even if the Saba email is not normalized', async () => {
    expect(await directory.findByEmail('ana.perez@saba.com')).toEqual({
      id: USER,
      email: 'ana.perez@saba.com',
      name: 'Ana',
      lastName: 'Pérez',
      role: 'cajero',
    });
  });

  it('returns null if it does not exist', async () => {
    expect(await directory.findByEmail('otro@saba.com')).toBeNull();
    expect(
      await directory.findById('22222222-2222-2222-2222-222222222222')
    ).toBeNull();
  });
});
