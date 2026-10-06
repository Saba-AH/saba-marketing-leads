import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import {
  assertLocalDatabase,
  isLocalDatabaseUrl,
  localDatabaseUrl,
  redactDatabaseUrl,
} from '../src/infrastructure/database/databaseUrl';
import { SYNC_USERS } from './sync/sabaSyncUsers';
import { syncSaba } from './sync/syncSaba';

/**
 * `npm run db:sync:saba` (lo lanza `scripts/localSupabase.mjs sync`, que antes
 * levanta y migra el stack local). Origen: DATABASE_SUPABASE del `.env`, solo
 * lectura. Destino: siempre el Supabase local, sin importar DB_TARGET.
 */
loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

async function main(): Promise<void> {
  const sourceUrl = process.env.DATABASE_SUPABASE?.trim();
  if (!sourceUrl) {
    throw new Error(
      'DATABASE_SUPABASE está vacía en apps/api/.env: es de donde se copia'
    );
  }
  if (isLocalDatabaseUrl(sourceUrl)) {
    throw new Error(
      'DATABASE_SUPABASE apunta a una base local: el origen tiene que ser prod'
    );
  }
  const targetUrl = localDatabaseUrl();
  assertLocalDatabase(targetUrl, 'el sync');

  console.log(`  Origen:  ${redactDatabaseUrl(sourceUrl)} (solo lectura)`);
  console.log(`  Destino: ${redactDatabaseUrl(targetUrl)}`);
  console.log(`  Admins:   ${SYNC_USERS.admins.join(', ')}`);
  console.log(`  Clientes: ${SYNC_USERS.clientes.join(', ')}\n`);

  const source = new Pool({ connectionString: sourceUrl });
  const target = new Pool({ connectionString: targetUrl });
  const started = Date.now();
  try {
    const report = await syncSaba({ source, target, users: SYNC_USERS });
    for (const { table, rows } of report.tables) {
      console.log(`  ${String(rows).padStart(6)}  ${table}`);
    }
    for (const warning of report.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\n✓ sincronizado en ${seconds} s`);
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error: unknown) => {
  console.error(
    '✗ falló la sincronización:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
