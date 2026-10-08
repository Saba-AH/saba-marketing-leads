import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { allowedOrigins } from '../src/infrastructure/bootstrap/allowedOrigins';
import {
  shouldColor,
  startupBanner,
} from '../src/infrastructure/bootstrap/startupBanner';
import {
  dbTarget,
  resolveDatabaseUrl,
} from '../src/infrastructure/database/databaseUrl';
import { loadAuthConfig } from '../src/modules/auth/infrastructure/authConfig';
import { DEV_ADMIN } from '../src/modules/auth/infrastructure/persistence/seedDevAdmin';

/**
 * Turbo sidebar task `@repo/api#dev:info`: the same summary the API prints at
 * startup, on its own and without logs on top. It reads the same as the API
 * (`.env` + what `scripts/localSupabase.mjs` injects), so it shows what it
 * will run against, and warns about what is missing before the API crashes.
 */
loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

const warnings: string[] = [];
let databaseUrl: string | null = null;
try {
  databaseUrl = resolveDatabaseUrl();
} catch (error: unknown) {
  warnings.push(error instanceof Error ? error.message : String(error));
}

// The API does not start without the auth config: better to see it here with the reason.
let authUrl: string | undefined;
try {
  authUrl = loadAuthConfig().supabaseUrl;
} catch (error: unknown) {
  warnings.push(error instanceof Error ? error.message : String(error));
}

console.log(
  startupBanner({
    port: Number(process.env.PORT) || 8080,
    databaseUrl,
    dbTarget: dbTarget(),
    explicitDatabase: Boolean(process.env.DATABASE),
    panelUrl: allowedOrigins()[0],
    studioUrl: process.env.SUPABASE_STUDIO_URL,
    authUrl,
    devLogin: { email: DEV_ADMIN.email, password: DEV_ADMIN.password },
    warnings,
    // Turbo does not give the task a TTY, but its TUI shows colors.
    color: shouldColor(),
  })
);
