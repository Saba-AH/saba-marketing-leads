import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/infrastructure/database/db-schema';
import { createPool } from '../src/infrastructure/database/migrator';

/**
 * Siembra la base con los catálogos base del dominio.
 *
 * El template arranca sin dominio, así que este seed es un no-op documentado:
 * sirve de ejemplo de cómo cablear una siembra idempotente y solo aditiva
 * (segura de correr sobre una base en uso).
 *
 * Para sembrar algo real, escribe una función `seedX(db)` en el módulo dueño de
 * la tabla (p. ej. `modules/<modulo>/infrastructure/persistence/seedX.ts`),
 * impórtala acá y llámala dentro del `try`.
 */
async function main(): Promise<void> {
  const pool = createPool();
  const db = drizzle(pool, { schema });

  try {
    // Ejemplo: await seedRoles(db);
    void db;
    console.log('✓ seed sin cambios: no hay catálogos que sembrar todavía');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('✗ falló la siembra:', error);
  process.exit(1);
});
