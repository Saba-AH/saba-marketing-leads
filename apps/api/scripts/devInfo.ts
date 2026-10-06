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

/**
 * Tarea `@repo/api#dev:info` del sidebar de turbo: el mismo resumen que
 * imprime la API al arrancar, solo y sin logs encima. Lee lo mismo que la API
 * (`.env` + lo que inyecta `scripts/localSupabase.mjs`), así que muestra
 * contra qué va a correr, y avisa lo que falta antes de que la API se caiga.
 */
loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

const warnings: string[] = [];
let databaseUrl: string | null = null;
try {
  databaseUrl = resolveDatabaseUrl();
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
    warnings,
    // Turbo no le da una TTY a la tarea, pero su TUI muestra los colores.
    color: shouldColor(),
  })
);
