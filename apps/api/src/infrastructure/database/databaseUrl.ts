/**
 * Resolución de la cadena de conexión. Única fuente para la API, los scripts
 * de migración y drizzle-kit: si cada uno decidiera por su cuenta, un
 * `db:migrate` podría ir a una base y la API a otra.
 *
 * Precedencia:
 *   1. `DATABASE` — explícita, gana siempre (despliegue, CI, tests).
 *   2. `DB_TARGET` — `local` (default) o `supabase`, que eligen entre
 *      `DATABASE_LOCAL` y `DATABASE_SUPABASE`.
 *
 * No carga `.env`: eso lo hace quien llama, una sola vez.
 */

/** Postgres del stack local de Supabase (`supabase/config.toml`, `[db] port`). */
export const DEFAULT_LOCAL_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:54332/postgres';

const DB_TARGETS = ['local', 'supabase'] as const;
export type DbTarget = (typeof DB_TARGETS)[number];

export function dbTarget(): DbTarget {
  const valor = (process.env.DB_TARGET ?? 'local').trim().toLowerCase();
  if (!(DB_TARGETS as readonly string[]).includes(valor)) {
    throw new Error(
      `DB_TARGET="${process.env.DB_TARGET}" no es válido. Usar: ${DB_TARGETS.join(' | ')}.`
    );
  }
  return valor as DbTarget;
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
  // Sin fallback a local a propósito: pedir Supabase y caer en silencio en
  // el stack local haría creer que se está mirando producción.
  const supabase = process.env.DATABASE_SUPABASE;
  if (!supabase) {
    throw new Error(
      'DB_TARGET=supabase pero DATABASE_SUPABASE está vacía (apps/api/.env).'
    );
  }
  return supabase;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Si la base está en esta máquina (el stack local), sin importar cómo se eligió. */
export function isLocalDatabaseUrl(url: string): boolean {
  return LOCAL_HOSTS.has(new URL(url).hostname);
}

/** Para logs: nunca imprimir credenciales. */
export function redactDatabaseUrl(url: string): string {
  return url.replace(/\/\/[^@]*@/, '//***@');
}
