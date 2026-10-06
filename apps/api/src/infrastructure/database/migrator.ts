import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { localDatabaseUrl, resolveDatabaseUrl } from './databaseUrl';

/**
 * Infraestructura compartida por los comandos de migración.
 */

const API_ROOT = resolve(__dirname, '../../..');

export const MIGRATIONS_FOLDER = resolve(API_ROOT, 'drizzle');
export const DOWN_FOLDER = resolve(MIGRATIONS_FOLDER, 'down');

function loadApiEnv(): void {
  loadEnv({ path: resolve(API_ROOT, '.env'), quiet: true });
}

/** La base que eligen `DATABASE` / `DB_TARGET` (ver `databaseUrl.ts`). */
export function databaseUrl(): string {
  loadApiEnv();
  return resolveDatabaseUrl();
}

/**
 * La base para los tests: siempre la local (o la `DATABASE` explícita del
 * CI), **nunca** la que elige `DB_TARGET`. La suite crea una base aparte y
 * trunca tablas: con `DB_TARGET=supabase` en el `.env` no puede terminar
 * corriendo contra Supabase.
 */
export function testBaseDatabaseUrl(): string {
  loadApiEnv();
  return process.env.DATABASE || localDatabaseUrl();
}

export function createPool(url = databaseUrl()): Pool {
  return new Pool({ connectionString: url });
}

/**
 * Extensiones que el esquema necesita para siquiera crearse: sin `vector` la
 * columna `embedding` no existe como tipo.
 *
 * En local las siembra el init de docker-compose, pero eso solo corre al crear
 * el volumen — una base nueva (la de tests, o Cloud SQL) no pasa por ahí. Es
 * idempotente, así que corre siempre antes de migrar.
 */
export async function ensureExtensions(pool: Pool): Promise<void> {
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}
