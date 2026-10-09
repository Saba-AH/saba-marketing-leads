/**
 * Connection string resolution. Single source for the API, the migration
 * scripts and drizzle-kit: if each one decided on its own, a `db:migrate`
 * could go to one database and the API to another.
 *
 * One variable, `DATABASE`, in every environment: local points to the
 * docker-compose Postgres, dev/prod to their EC2. Changing environment is
 * changing `.env`, never the command.
 *
 * It does not load `.env`: the caller does that, once.
 */

/** Postgres of `docker-compose.yml` (`POSTGRES_PORT`, 5434 by default). */
export const DEFAULT_LOCAL_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5434/app_dev';

export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string {
  const explicit = env.DATABASE?.trim();
  if (explicit) return explicit;
  // No silent fallback in production: a deploy without DATABASE would keep
  // retrying against a localhost that does not exist and only show it in /health.
  if (env.NODE_ENV === 'production') {
    throw new Error('DATABASE está vacía: en producción es obligatoria');
  }
  return DEFAULT_LOCAL_DATABASE_URL;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Whether the database is on this machine (the docker-compose one). */
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
