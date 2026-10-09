import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
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
 * Reverts applied migrations.
 *
 * Drizzle records what was applied in `drizzle.__drizzle_migrations`, matching
 * `created_at` with the journal's `when`. Reverting means: run that tag's
 * `.down.sql` and delete its row, so `migrate` applies it again.
 *
 * By default it reverts only the last one. With `--all` it reverts all of them
 * in reverse order, until the database has no applied migrations — which is
 * what `db:reset` needs to be a real reset and not just a "redo" of the last
 * one.
 */

/** @returns `true` if it reverted one, `false` if none was left. */
async function revertLast(pool: Pool): Promise<boolean> {
  const applied = await pool.query<{ id: number; created_at: string }>(
    'SELECT id, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1'
  );

  const last = applied.rows[0];
  if (!last) return false;

  const journal = JSON.parse(
    readFileSync(join(MIGRATIONS_FOLDER, 'meta', '_journal.json'), 'utf8')
  ) as { entries: JournalEntry[] };

  const entry = journal.entries.find(
    (item) => String(item.when) === String(last.created_at)
  );

  if (!entry) {
    throw new Error(
      `la base tiene aplicada una migración (created_at=${last.created_at}) que no está en el journal`
    );
  }

  const downPath = join(DOWN_FOLDER, `${entry.tag}.down.sql`);
  if (!existsSync(downPath)) {
    throw new Error(`falta la reversa: drizzle/down/${entry.tag}.down.sql`);
  }

  const sql = readFileSync(downPath, 'utf8');

  // All or nothing: if the reverse fails halfway, the record is untouched and the
  // database stays as it was.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'DELETE FROM drizzle.__drizzle_migrations WHERE id = $1',
      [last.id]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(`✓ revertida ${entry.tag}`);
  return true;
}

async function main(): Promise<void> {
  const all = process.argv.includes('--all');

  // `--all` reverts the WHOLE database (used by `db:reset`). If DATABASE does not
  // point to a local host, require explicit confirmation so a shared or remote
  // server is not wiped by accident.
  if (all) {
    const host = new URL(databaseUrl()).hostname;
    const isLocal =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal && process.env.CONFIRM_RESET !== '1') {
      console.error(
        `✗ "--all" apunta a un host no local (${host}). Exporta CONFIRM_RESET=1 para confirmar.`
      );
      process.exit(1);
    }
  }

  const pool = createPool();

  try {
    // If no migration ever ran, the bookkeeping table does not exist: without this
    // check, the query would throw `relation ... does not exist` and read as a
    // rollback failure instead of "nothing to revert".
    const exists = await pool.query<{ table_name: string | null }>(
      "SELECT to_regclass('drizzle.__drizzle_migrations') AS table_name"
    );
    if (!exists.rows[0]?.table_name) {
      console.log('✓ no hay migraciones aplicadas; nada que revertir');
      return;
    }

    if (all) {
      let n = 0;
      while (await revertLast(pool)) n++;
      console.log(
        n === 0 ? '✓ no había nada que revertir' : `✓ revertidas ${n}`
      );
      return;
    }

    if (!(await revertLast(pool))) {
      console.log('✓ no hay migraciones aplicadas; nada que revertir');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la reversión:', error);
  process.exit(1);
});

export {};
