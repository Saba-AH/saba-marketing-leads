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
 * Revierte migraciones aplicadas.
 *
 * Drizzle registra lo aplicado en `drizzle.__drizzle_migrations`, emparejando
 * `created_at` con el `when` del journal. Revertir es: correr el `.down.sql` de
 * esa etiqueta y borrar su fila, para que `migrate` la vuelva a aplicar.
 *
 * Por defecto revierte solo la última. Con `--all` revierte todas en orden
 * inverso, hasta dejar la base sin migraciones aplicadas — que es lo que
 * `db:reset` necesita para ser un reset de verdad y no solo un "redo" de la
 * última.
 */

/** @returns `true` si revirtió una, `false` si no quedaba ninguna. */
async function revertirUltima(pool: Pool): Promise<boolean> {
  const aplicadas = await pool.query<{ id: number; created_at: string }>(
    'SELECT id, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1'
  );

  const ultima = aplicadas.rows[0];
  if (!ultima) return false;

  const journal = JSON.parse(
    readFileSync(join(MIGRATIONS_FOLDER, 'meta', '_journal.json'), 'utf8')
  ) as { entries: JournalEntry[] };

  const entrada = journal.entries.find(
    (item) => String(item.when) === String(ultima.created_at)
  );

  if (!entrada) {
    throw new Error(
      `la base tiene aplicada una migración (created_at=${ultima.created_at}) que no está en el journal`
    );
  }

  const downPath = join(DOWN_FOLDER, `${entrada.tag}.down.sql`);
  if (!existsSync(downPath)) {
    throw new Error(`falta la reversa: drizzle/down/${entrada.tag}.down.sql`);
  }

  const sql = readFileSync(downPath, 'utf8');

  // Todo o nada: si la reversa falla a medias, el registro no se toca y la
  // base queda como estaba.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'DELETE FROM drizzle.__drizzle_migrations WHERE id = $1',
      [ultima.id]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(`✓ revertida ${entrada.tag}`);
  return true;
}

async function main(): Promise<void> {
  const todas = process.argv.includes('--all');

  // `--all` revierte TODA la base (lo usa `db:reset`). Si DATABASE no apunta a un
  // host local, exigir confirmación explícita para no borrar un servidor
  // compartido o remoto por accidente.
  if (todas) {
    const host = new URL(databaseUrl()).hostname;
    const esLocal =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!esLocal && process.env.CONFIRMAR_RESET !== '1') {
      console.error(
        `✗ "--all" apunta a un host no local (${host}). Exportá CONFIRMAR_RESET=1 para confirmar.`
      );
      process.exit(1);
    }
  }

  const pool = createPool();

  try {
    // Si nunca corrió una migración, la tabla de bookkeeping no existe: sin este
    // chequeo, la consulta lanzaría `relation ... does not exist` y se leería
    // como un fallo de reversión en vez de "nada que revertir".
    const existe = await pool.query<{ tabla: string | null }>(
      "SELECT to_regclass('drizzle.__drizzle_migrations') AS tabla"
    );
    if (!existe.rows[0]?.tabla) {
      console.log('✓ no hay migraciones aplicadas; nada que revertir');
      return;
    }

    if (todas) {
      let n = 0;
      while (await revertirUltima(pool)) n++;
      console.log(
        n === 0 ? '✓ no había nada que revertir' : `✓ revertidas ${n}`
      );
      return;
    }

    if (!(await revertirUltima(pool))) {
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
