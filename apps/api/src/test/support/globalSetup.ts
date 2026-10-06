import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import {
  ensureExtensions,
  MIGRATIONS_FOLDER,
  testBaseDatabaseUrl,
} from '../../infrastructure/database/migrator';
import { TEST_DATABASE_NAME, testDatabaseUrl } from './testDatabase';

/**
 * Prepara la base de tests una sola vez por corrida: la crea si no existe,
 * habilita las extensiones y aplica las migraciones.
 *
 * Se apoya en las migraciones reales y no en un `push` del esquema: si una
 * migración está mal escrita, la suite tiene que enterarse acá y no en el
 * despliegue.
 */
export default async function setup(): Promise<void> {
  // Cambiar solo la base de datos, preservando el query string (p. ej. sslmode).
  const mantenimientoUrl = new URL(testBaseDatabaseUrl());
  mantenimientoUrl.pathname = '/postgres';
  const mantenimiento = new Pool({
    connectionString: mantenimientoUrl.toString(),
  });

  try {
    const existe = await mantenimiento.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DATABASE_NAME]
    );
    if (existe.rowCount === 0) {
      // No admite parámetros: el nombre es una constante del repositorio.
      await mantenimiento.query(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
    }
  } finally {
    await mantenimiento.end();
  }

  const pool = new Pool({ connectionString: testDatabaseUrl() });
  try {
    await ensureExtensions(pool);
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
