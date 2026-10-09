import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { redactDatabaseUrl } from '../src/infrastructure/database/databaseUrl';
import {
  createPool,
  DOWN_FOLDER,
  databaseUrl,
  MIGRATIONS_FOLDER,
} from '../src/infrastructure/database/migrator';

interface JournalEntry {
  tag: string;
  when: number;
}

/**
 * Every migration must ship with a hand-written reverse. Drizzle Kit does not
 * generate `down`, so if it is not enforced here nobody writes it — and
 * "reverting" stops being possible exactly the day it is needed.
 */
function assertDownMigrationsExist(): void {
  const journalPath = join(MIGRATIONS_FOLDER, 'meta', '_journal.json');
  if (!existsSync(journalPath)) return;

  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: JournalEntry[];
  };

  const missing = journal.entries
    .map((entry) => entry.tag)
    .filter((tag) => !existsSync(join(DOWN_FOLDER, `${tag}.down.sql`)));

  if (missing.length > 0) {
    console.error(
      `✗ faltan las migraciones de reversa:\n${missing
        .map((tag) => `    drizzle/down/${tag}.down.sql`)
        .join('\n')}`
    );
    process.exit(1);
  }
}

/** Arbitrary, stable key for the migration lock (pg_advisory_lock). */
const MIGRATION_LOCK = 4023;

async function main(): Promise<void> {
  assertDownMigrationsExist();

  const url = databaseUrl();
  const pool = createPool(url);

  try {
    // `migrate()` takes no lock on its own: two instances migrating at once —a
    // deploy with several replicas— would step on each other. The lock has to be
    // on the SAME client that runs the migration; a loose `pool.query` could take
    // another session from the pool and protect nothing.
    const client = await pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
      await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]);
      client.release();
    }

    console.log(`✓ migraciones aplicadas sobre ${redactDatabaseUrl(url)}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la migración:', error);
  process.exit(1);
});
