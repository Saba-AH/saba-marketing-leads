import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { localDatabaseUrl, resolveDatabaseUrl } from './databaseUrl';

/**
 * Infrastructure shared by the migration commands.
 */

const API_ROOT = resolve(__dirname, '../../..');

export const MIGRATIONS_FOLDER = resolve(API_ROOT, 'drizzle');
export const DOWN_FOLDER = resolve(MIGRATIONS_FOLDER, 'down');

function loadApiEnv(): void {
  loadEnv({ path: resolve(API_ROOT, '.env'), quiet: true });
}

/** The database chosen by `DATABASE` / `DB_TARGET` (see `databaseUrl.ts`). */
export function databaseUrl(): string {
  loadApiEnv();
  return resolveDatabaseUrl();
}

/**
 * The database for tests: always the local one (or CI's explicit
 * `DATABASE`), **never** the one `DB_TARGET` picks. The suite creates a
 * separate database and truncates tables: with `DB_TARGET=supabase` in `.env`
 * it must never end up running against Supabase.
 */
export function testBaseDatabaseUrl(): string {
  loadApiEnv();
  return process.env.DATABASE || localDatabaseUrl();
}

export function createPool(url = databaseUrl()): Pool {
  return new Pool({ connectionString: url });
}

/**
 * Extensions the schema needs to even be created: without `vector` the
 * `embedding` column does not exist as a type.
 *
 * A new database (the test one, or Cloud SQL) does not have them. It is
 * idempotent, so it always runs before migrating.
 */
export async function ensureExtensions(pool: Pool): Promise<void> {
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}
