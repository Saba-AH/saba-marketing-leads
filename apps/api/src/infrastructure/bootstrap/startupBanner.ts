import {
  type DbTarget,
  isLocalDatabaseUrl,
  redactDatabaseUrl,
} from '../database/databaseUrl';

export interface StartupBannerInput {
  port: number;
  databaseUrl: string;
  dbTarget: DbTarget;
  explicitDatabase: boolean;
  /** Origen del panel (el primero de CORS_ALLOWED_ORIGINS). */
  panelUrl?: string;
  /** Studio del stack local; lo exporta `scripts/localSupabase.mjs`. */
  studioUrl?: string;
}

/**
 * Lo que se imprime al arrancar, para humanos: contra qué base corre y qué
 * se puede abrir. Confundir el stack local con Supabase es el error caro, así
 * que va primero y en mayúsculas.
 */
export function startupBanner(input: StartupBannerInput): string {
  const local = isLocalDatabaseUrl(input.databaseUrl);
  const api = `http://localhost:${input.port}`;
  const origen = input.explicitDatabase
    ? 'DATABASE explícita'
    : `DB_TARGET=${input.dbTarget}`;

  const lines = [
    '',
    local
      ? '  ● LOCAL — Supabase CLI en esta máquina'
      : '  ▲ SUPABASE remoto — datos reales, cuidado con lo que escribes',
    '',
    ...(input.panelUrl ? [`  Panel:    ${input.panelUrl}`] : []),
    `  API:      ${api}/api/v1`,
    `  Swagger:  ${api}/api/docs`,
    `  Health:   ${api}/api/v1/health`,
    ...(local && input.studioUrl ? [`  Studio:   ${input.studioUrl}`] : []),
    `  Base:     ${redactDatabaseUrl(input.databaseUrl)} (${origen})`,
    '',
  ];
  return lines.join('\n');
}
