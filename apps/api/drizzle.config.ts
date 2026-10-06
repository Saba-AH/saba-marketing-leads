import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolveDatabaseUrl } from './src/infrastructure/database/databaseUrl';

loadEnv({ path: resolve(__dirname, '.env') });

// Misma resolución que la API (`DATABASE` / `DB_TARGET`): `db:generate` y
// compañía apuntan a la misma base que la app.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/**/infrastructure/persistence/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
