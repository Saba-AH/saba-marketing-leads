import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/infrastructure/database/db-schema';
import {
  createPool,
  databaseUrl,
} from '../src/infrastructure/database/migrator';
import {
  assertLocalDatabase,
  DEV_ADMIN,
  seedDevAdmin,
} from '../src/modules/auth/infrastructure/persistence/seedDevAdmin';

/**
 * Siembra la base local de desarrollo. Idempotente y solo aditiva (segura de
 * correr sobre una base en uso). Se niega a correr contra una base remota: lo
 * que siembra (un admin con contraseña trivial) no puede llegar a Supabase.
 *
 * Para sembrar algo real, escribe una función `seedX(db)` en el módulo dueño de
 * la tabla (p. ej. `modules/<modulo>/infrastructure/persistence/seedX.ts`),
 * impórtala acá y llámala dentro del `try`.
 */
async function main(): Promise<void> {
  const url = databaseUrl();
  assertLocalDatabase(url);
  const pool = createPool(url);
  const db = drizzle(pool, { schema });

  try {
    await seedDevAdmin(db);
    console.log(
      `✓ admin de desarrollo: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la siembra:', error);
  process.exit(1);
});
