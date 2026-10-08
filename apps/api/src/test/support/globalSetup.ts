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
 * Prepares the test database once per run: creates it if it does not exist,
 * enables the extensions and applies the migrations.
 *
 * It relies on the real migrations and not on a schema `push`: if a migration
 * is badly written, the suite has to find out here and not at deploy time.
 */
export default async function setup(): Promise<void> {
  // Change only the database, keeping the query string (e.g. sslmode).
  const maintenanceUrl = new URL(testBaseDatabaseUrl());
  maintenanceUrl.pathname = '/postgres';
  const maintenance = new Pool({
    connectionString: maintenanceUrl.toString(),
  });

  try {
    const exists = await maintenance.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DATABASE_NAME]
    );
    if (exists.rowCount === 0) {
      // Takes no parameters: the name is a repository constant.
      await maintenance.query(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
    }
  } finally {
    await maintenance.end();
  }

  const pool = new Pool({ connectionString: testDatabaseUrl() });
  try {
    await ensureExtensions(pool);
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
