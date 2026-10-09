import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { allowedOrigins } from '../src/infrastructure/bootstrap/allowedOrigins';
import {
  shouldColor,
  startupBanner,
} from '../src/infrastructure/bootstrap/startupBanner';
import { resolveDatabaseUrl } from '../src/infrastructure/database/databaseUrl';
import { loadSabaApiConfig } from '../src/infrastructure/saba/sabaApi';
import { loadAuthConfig } from '../src/modules/auth/infrastructure/authConfig';

/**
 * Turbo sidebar task `@repo/api#dev:info`: the same summary the API prints at
 * startup, on its own and without logs on top. It reads the same `.env` as the
 * API, so it shows what it will run against, and warns about what is missing
 * before the API crashes.
 */
loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

const warnings: string[] = [];
function attempt<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch (error: unknown) {
    warnings.push(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

const databaseUrl = attempt(() => resolveDatabaseUrl()) ?? null;
// The API does not start without these: better to see it here with the reason.
const saba = attempt(() => loadSabaApiConfig());
attempt(() => loadAuthConfig());

console.log(
  startupBanner({
    port: Number(process.env.PORT) || 8080,
    databaseUrl,
    panelUrl: allowedOrigins()[0],
    sabaUrl: saba?.apiUrl,
    warnings,
    // Turbo does not give the task a TTY, but its TUI shows colors.
    color: shouldColor(),
  })
);
