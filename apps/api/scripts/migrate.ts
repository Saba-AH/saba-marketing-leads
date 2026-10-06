import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {
  dbTarget,
  redactDatabaseUrl,
} from '../src/infrastructure/database/databaseUrl';
import {
  createPool,
  DOWN_FOLDER,
  databaseUrl,
  ensureExtensions,
  MIGRATIONS_FOLDER,
} from '../src/infrastructure/database/migrator';

interface JournalEntry {
  tag: string;
  when: number;
}

/**
 * Toda migración debe traer su reversa escrita a mano. Drizzle Kit no genera
 * `down`, así que si no se exige aquí nadie la escribe — y "revertir" deja de
 * ser posible justo el día que hace falta.
 */
function assertDownMigrationsExist(): void {
  const journalPath = join(MIGRATIONS_FOLDER, 'meta', '_journal.json');
  if (!existsSync(journalPath)) return;

  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: JournalEntry[];
  };

  const faltantes = journal.entries
    .map((entry) => entry.tag)
    .filter((tag) => !existsSync(join(DOWN_FOLDER, `${tag}.down.sql`)));

  if (faltantes.length > 0) {
    console.error(
      `✗ faltan las migraciones de reversa:\n${faltantes
        .map((tag) => `    drizzle/down/${tag}.down.sql`)
        .join('\n')}`
    );
    process.exit(1);
  }
}

/** Clave arbitraria y estable del lock de migración (pg_advisory_lock). */
const LOCK_MIGRACION = 4023;

async function main(): Promise<void> {
  assertDownMigrationsExist();

  const url = databaseUrl();
  const pool = createPool(url);

  try {
    await ensureExtensions(pool);

    // `migrate()` no toma lock por sí solo: dos instancias migrando a la vez —un
    // deploy con varias réplicas— se pisarían. El lock tiene que ir en el MISMO
    // cliente que corre la migración; un `pool.query` suelto podría tomar otra
    // sesión del pool y no protegería nada.
    const client = await pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [LOCK_MIGRACION]);
      await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_MIGRACION]);
      client.release();
    }

    console.log(
      `✓ migraciones aplicadas sobre ${redactDatabaseUrl(url)} (DB_TARGET=${process.env.DATABASE ? 'DATABASE explícita' : dbTarget()})`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la migración:', error);
  process.exit(1);
});
