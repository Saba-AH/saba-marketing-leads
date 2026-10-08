/**
 * Connection string resolution. Single source for the API, the migration
 * scripts and drizzle-kit: if each one decided on its own, a `db:migrate`
 * could go to one database and the API to another.
 *
 * Precedence:
 *   1. `DATABASE` — explicit, always wins (deploy, CI, tests).
 *   2. `DB_TARGET` — `local` (default) or `supabase`; set by the command
 *      (`npm run dev:local` / `dev:supabase`), not by `.env`. Chooses between
 *      `DATABASE_LOCAL` and `DATABASE_SUPABASE`.
 *
 * It does not load `.env`: the caller does that, once.
 */

/** Postgres of the local Supabase stack (`supabase/config.toml`, `[db] port`). */
export const DEFAULT_LOCAL_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:54332/postgres';

const DB_TARGETS = ['local', 'supabase'] as const;
export type DbTarget = (typeof DB_TARGETS)[number];

export function dbTarget(): DbTarget {
  const value = (process.env.DB_TARGET ?? 'local').trim().toLowerCase();
  if (!(DB_TARGETS as readonly string[]).includes(value)) {
    throw new Error(
      `DB_TARGET="${process.env.DB_TARGET}" no es válido. Usar: ${DB_TARGETS.join(' | ')}.`
    );
  }
  return value as DbTarget;
}

export function localDatabaseUrl(): string {
  return process.env.DATABASE_LOCAL || DEFAULT_LOCAL_DATABASE_URL;
}

export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE) {
    return process.env.DATABASE;
  }
  if (dbTarget() === 'local') {
    return localDatabaseUrl();
  }
  // No fallback to local on purpose: asking for Supabase and silently landing on
  // the local stack would make people believe they are looking at production.
  const supabase = process.env.DATABASE_SUPABASE;
  if (!supabase) {
    throw new Error(
      'destino supabase (`npm run dev:supabase` / `db:migrate:supabase`) pero DATABASE_SUPABASE está vacía en apps/api/.env'
    );
  }
  return supabase;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Whether the database is on this machine (the local stack), regardless of how it was chosen. */
export function isLocalDatabaseUrl(url: string): boolean {
  return LOCAL_HOSTS.has(new URL(url).hostname);
}

/** Guard for commands that write test data: never against a remote database. */
export function assertLocalDatabase(url: string, operation: string): void {
  if (!isLocalDatabaseUrl(url)) {
    throw new Error(
      `${operation} solo escribe en una base local (host: ${new URL(url).hostname})`
    );
  }
}

/** For logs: never print credentials. */
export function redactDatabaseUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}
