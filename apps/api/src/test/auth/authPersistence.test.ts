import { sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DrizzleLoginAttempts } from '../../modules/auth/infrastructure/persistence/DrizzleLoginAttempts';
import { DrizzleStaffDirectory } from '../../modules/auth/infrastructure/persistence/DrizzleStaffDirectory';
import { closeTestDb, getTestDb, resetDatabase } from '../support/testDatabase';

const USER = '11111111-1111-1111-1111-111111111111';
const AHORA = new Date('2026-10-06T12:00:00.000Z');
const HACE_UNA_HORA = new Date('2026-10-06T11:00:00.000Z');

afterAll(async () => {
  await closeTestDb();
});

describe('DrizzleLoginAttempts (contra Postgres)', () => {
  const attempts = new DrizzleLoginAttempts(getTestDb());

  beforeEach(async () => {
    await resetDatabase();
  });

  async function fallo(
    reason: 'bad_credentials' | 'rate_limited',
    ip = '10.0.0.1'
  ): Promise<void> {
    await attempts.record({
      correo: 'x@y.com',
      userId: null,
      ip,
      userAgent: null,
      success: false,
      reason,
    });
  }

  it('cuenta los fallos recientes de la IP sin contar los del propio límite', async () => {
    await fallo('bad_credentials');
    await fallo('bad_credentials');
    await fallo('rate_limited');
    await fallo('bad_credentials', '10.0.0.2');
    await getTestDb().execute(
      sql`UPDATE login_attempts SET created_at = ${HACE_UNA_HORA.toISOString()} WHERE ip = '10.0.0.2'`
    );

    const desde = new Date(Date.now() - 15 * 60 * 1000);
    expect(await attempts.countRecentIpFailures('10.0.0.1', desde)).toBe(2);
    expect(await attempts.countRecentIpFailures('10.0.0.2', desde)).toBe(0);
  });

  it('guarda, actualiza y reinicia el contador de bloqueo', async () => {
    expect(await attempts.findLockout(USER)).toBeNull();

    await attempts.saveLockout(
      { userId: USER, failedCount: 1, lockedAt: null },
      'staff@saba.com',
      AHORA
    );
    await attempts.saveLockout(
      { userId: USER, failedCount: 2, lockedAt: null },
      'staff@saba.com',
      AHORA
    );
    expect(await attempts.findLockout(USER)).toEqual({
      userId: USER,
      failedCount: 2,
      lockedAt: null,
    });

    await attempts.resetFailures(USER, AHORA);
    expect((await attempts.findLockout(USER))?.failedCount).toBe(0);
  });

  it('no reinicia una cuenta bloqueada: eso se hace desde Saba', async () => {
    await attempts.saveLockout(
      { userId: USER, failedCount: 5, lockedAt: AHORA },
      'staff@saba.com',
      AHORA
    );

    await attempts.resetFailures(USER, AHORA);

    expect(await attempts.findLockout(USER)).toEqual({
      userId: USER,
      failedCount: 5,
      lockedAt: AHORA,
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

  it('encuentra el perfil aunque el correo de Saba no esté normalizado', async () => {
    expect(await directory.findByEmail('ana.perez@saba.com')).toEqual({
      id: USER,
      correo: 'ana.perez@saba.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'cajero',
    });
  });

  it('devuelve null si no existe', async () => {
    expect(await directory.findByEmail('otro@saba.com')).toBeNull();
    expect(
      await directory.findById('22222222-2222-2222-2222-222222222222')
    ).toBeNull();
  });
});
