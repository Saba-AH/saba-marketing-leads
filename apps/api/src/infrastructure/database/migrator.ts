import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { assertLocalDatabase, resolveDatabaseUrl } from './databaseUrl';

/**
 * Infrastructure shared by the migration commands.
 */

const API_ROOT = resolve(__dirname, '../../..');

export const MIGRATIONS_FOLDER = resolve(API_ROOT, 'drizzle');
export const DOWN_FOLDER = resolve(MIGRATIONS_FOLDER, 'down');

function loadApiEnv(): void {
  loadEnv({ path: resolve(API_ROOT, '.env'), quiet: true });
}

/** `DATABASE` from the environment or `apps/api/.env` (see `databaseUrl.ts`). */
export function databaseUrl(): string {
  loadApiEnv();
  return resolveDatabaseUrl();
}

/**
 * The server the test database is created on: the same `DATABASE`, which
 * must be local. The suite creates `app_dev_test` and truncates it; with
 * `.env` pointing to an EC2 it would do that on a real server.
 */
export function testBaseDatabaseUrl(): string {
  const url = databaseUrl();
  assertLocalDatabase(url, 'la suite de tests');
  return url;
}

export function createPool(url = databaseUrl()): Pool {
  return new Pool({ connectionString: url });
}
