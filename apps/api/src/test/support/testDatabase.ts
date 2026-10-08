import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../infrastructure/database/db-schema';
import type { ApiDb } from '../../infrastructure/database/drizzle.module';
import { testBaseDatabaseUrl } from '../../infrastructure/database/migrator';

/**
 * Connection to the test database.
 *
 * The E01 tickets ask for behavior tests **against local Postgres**, not
 * against a double: much of what needs verifying —the NOT NULL on
 * `destino_uso`, the unique index that gives idempotency, propagation by
 * reference— only exists in the database.
 *
 * It runs on a separate database (`app_dev_test`) so the suite can truncate
 * without wiping the development data.
 */

export const TEST_DATABASE_NAME = 'app_dev_test';

export function testDatabaseUrl(): string {
  // Derived from `testBaseDatabaseUrl()` —the same source the globalSetup
  // uses—, which loads `apps/api/.env` before reading `process.env.DATABASE`. If
  // only the shell env were read here, a `DATABASE` defined in `.env` would make
  // the setup migrate one server and the tests query another: failures from
  // missing tables with no visible cause.
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
 * Empties every table of the public schema at once.
 *
 * The list is discovered in the database and not kept by hand: a new table that
 * was not truncated would leak data from one test to the next, and that is the
 * kind of failure that shows up weeks later and in another test.
 */
export async function resetDatabase(): Promise<void> {
  const database = getTestDb();

  const { rows } = await database.execute<{ tables: string | null }>(sql`
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') AS tables
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  const tables = rows[0]?.tables;
  if (!tables) return;

  await database.execute(
    sql.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`)
  );
}
