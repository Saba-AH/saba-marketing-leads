import {
  type DbTarget,
  isLocalDatabaseUrl,
  redactDatabaseUrl,
} from '../database/databaseUrl';

export interface StartupBannerInput {
  port: number;
  /** `null` si no se pudo resolver (p. ej. DATABASE_SUPABASE vacía). */
  databaseUrl: string | null;
  dbTarget: DbTarget;
  explicitDatabase: boolean;
  /** Origen del panel (el primero de CORS_ALLOWED_ORIGINS). */
  panelUrl?: string;
  /** Studio del stack local; lo exporta `scripts/localSupabase.mjs`. */
  studioUrl?: string;
  /** Supabase Auth contra el que se validan las sesiones (`SUPABASE_URL`). */
  authUrl?: string;
  /** Credenciales del admin del seed: solo se muestran si la base es local. */
  devLogin?: { correo: string; contrasena: string };
  /** Lo que falta o está mal en la configuración. */
  warnings?: string[];
  color: boolean;
}

/** Códigos ANSI, para que el recuadro se distinga entre los logs JSON. */
const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
} as const;

const LABEL_WIDTH = 9;

interface Row {
  label: string;
  value: string;
  warning?: boolean;
}

/** Colores solo en desarrollo: en Cloud Run ensuciarían los logs. */
export function shouldColor(env: NodeJS.ProcessEnv = process.env): boolean {
  return !env.NO_COLOR && env.NODE_ENV !== 'production';
}

/**
 * Lo que se imprime al arrancar, para humanos: contra qué base corre y qué
 * se puede abrir. Confundir el stack local con Supabase es el error caro, así
 * que va en el título, en mayúsculas y en color (verde local, rojo remoto).
 * Lo usan la API al arrancar y la tarea `dev:info` del sidebar de turbo.
 */
export function startupBanner(input: StartupBannerInput): string {
  const local = input.databaseUrl
    ? isLocalDatabaseUrl(input.databaseUrl)
    : input.dbTarget === 'local';
  const api = `http://localhost:${input.port}`;
  const origen = input.explicitDatabase
    ? 'DATABASE explícita'
    : `destino ${input.dbTarget}`;

  const rows: Row[] = [
    ...(input.panelUrl ? [{ label: 'Panel', value: input.panelUrl }] : []),
    { label: 'API', value: `${api}/api/v1` },
    { label: 'Swagger', value: `${api}/api/docs` },
    { label: 'Health', value: `${api}/api/v1/health` },
    ...(local && input.studioUrl
      ? [{ label: 'Studio', value: input.studioUrl }]
      : []),
    {
      label: 'Base',
      value: input.databaseUrl
        ? `${redactDatabaseUrl(input.databaseUrl)} (${origen})`
        : `sin resolver (${origen})`,
    },
    ...(input.authUrl ? [{ label: 'Auth', value: input.authUrl }] : []),
    ...(local && input.devLogin
      ? [
          {
            label: 'Login',
            value: `${input.devLogin.correo} / ${input.devLogin.contrasena}`,
          },
        ]
      : []),
    ...(input.warnings ?? []).map((warning) => ({
      label: '⚠',
      value: warning,
      warning: true,
    })),
  ];

  const title = local
    ? '● LOCAL · Supabase CLI en esta máquina'
    : '▲ SUPABASE REMOTO · datos reales, cuidado con lo que escribes';
  return drawBox(title, rows, local ? ANSI.green : ANSI.red, input.color);
}

function drawBox(
  title: string,
  rows: Row[],
  tone: string,
  color: boolean
): string {
  const paint = (text: string, ...codes: string[]): string =>
    color ? `${codes.join('')}${text}${ANSI.reset}` : text;
  const border = (text: string): string => paint(text, tone);

  const text = (row: Row): string =>
    row.warning
      ? `${row.label} ${row.value}`
      : `${row.label.padEnd(LABEL_WIDTH)}${row.value}`;
  // Se mide el texto sin colores: los códigos ANSI no ocupan columnas.
  const width = Math.max(
    title.length + 1,
    ...rows.map((row) => text(row).length)
  );

  const lines = [
    border('╭─ ') +
      paint(title, ANSI.bold, tone) +
      border(` ${'─'.repeat(width - title.length - 1)}╮`),
    ...rows.map((row) => {
      const padding = ' '.repeat(width - text(row).length);
      const content = row.warning
        ? paint(text(row), ANSI.yellow)
        : paint(row.label.padEnd(LABEL_WIDTH), ANSI.dim) + row.value;
      return `${border('│')} ${content}${padding} ${border('│')}`;
    }),
    border(`╰${'─'.repeat(width + 2)}╯`),
  ];
  return ['', ...lines.map((line) => `  ${line}`), ''].join('\n');
}
