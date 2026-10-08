import { drizzle } from 'drizzle-orm/node-postgres';
import { assertLocalDatabase } from '../src/infrastructure/database/databaseUrl';
import * as schema from '../src/infrastructure/database/db-schema';
import {
  createPool,
  databaseUrl,
} from '../src/infrastructure/database/migrator';
import {
  DEV_ADMIN,
  seedDevAdmin,
} from '../src/modules/auth/infrastructure/persistence/seedDevAdmin';

/**
 * Seeds the local development database. Idempotent and additive only (safe to
 * run on a database in use). It refuses to run against a remote database: what
 * it seeds (an admin with a trivial password) must never reach Supabase.
 *
 * To seed something real, write a `seedX(db)` function in the module that owns
 * the table (e.g. `modules/<module>/infrastructure/persistence/seedX.ts`),
 * import it here and call it inside the `try`.
 */
async function main(): Promise<void> {
  const url = databaseUrl();
  assertLocalDatabase(url, 'el seed');
  const pool = createPool(url);
  const db = drizzle(pool, { schema });

  try {
    if (await seedDevAdmin(db)) {
      console.log(
        `✓ admin de desarrollo: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`
      );
    } else {
      console.log(
        `✓ ${DEV_ADMIN.email} ya existe (sincronizado de prod): se entra con su contraseña real`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la siembra:', error);
  process.exit(1);
});
