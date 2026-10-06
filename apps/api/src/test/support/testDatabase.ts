import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../infrastructure/database/db-schema';
import type { ApiDb } from '../../infrastructure/database/drizzle.module';
import { testBaseDatabaseUrl } from '../../infrastructure/database/migrator';

/**
 * Conexión a la base de tests.
 *
 * Los tickets de E01 piden pruebas de comportamiento **contra Postgres local**,
 * no contra un doble: buena parte de lo que hay que verificar —el NOT NULL de
 * `destino_uso`, el índice único que da idempotencia, la propagación por
 * referencia— solo existe en la base.
 *
 * Corre sobre una base aparte (`app_dev_test`) para que la suite pueda truncar
 * sin llevarse por delante los datos de desarrollo.
 */

export const TEST_DATABASE_NAME = 'app_dev_test';

export function testDatabaseUrl(): string {
  // Se deriva de `testBaseDatabaseUrl()` —la misma fuente que usa el
  // globalSetup—, que carga `apps/api/.env` antes de leer `process.env.DATABASE`. Si acá se leyera
  // solo el env del shell, un `DATABASE` definido en `.env` haría que el setup
  // migre en un server y los tests consulten otro: fallos por tablas ausentes
  // sin causa visible.
  const url = new URL(testBaseDatabaseUrl());
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
}

let pool: Pool | undefined;
let db: ApiDb | undefined;

export function getTestDb(): ApiDb {
  if (!db) {
    pool = new Pool({ connectionString: testDatabaseUrl() });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeTestDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  db = undefined;
}

/**
 * Vacía todas las tablas del esquema público de una sola vez.
 *
 * La lista se descubre en la base y no se mantiene a mano: una tabla nueva que
 * no se truncara filtraría datos de un test al siguiente, y ese es el tipo de
 * fallo que aparece semanas después y en otro test.
 */
export async function resetDatabase(): Promise<void> {
  const database = getTestDb();

  const { rows } = await database.execute<{ tablas: string | null }>(sql`
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') AS tablas
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  const tablas = rows[0]?.tablas;
  if (!tablas) return;

  await database.execute(
    sql.raw(`TRUNCATE TABLE ${tablas} RESTART IDENTITY CASCADE`)
  );
}
