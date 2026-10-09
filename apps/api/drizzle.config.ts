import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolveDatabaseUrl } from './src/infrastructure/database/databaseUrl';

loadEnv({ path: resolve(__dirname, '.env') });

// Same resolution as the API (`DATABASE`): `db:generate` and
// friends point at the same database as the app.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/**/infrastructure/persistence/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
