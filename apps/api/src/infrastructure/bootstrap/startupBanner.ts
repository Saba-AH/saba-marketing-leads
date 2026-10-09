import { isLocalDatabaseUrl, redactDatabaseUrl } from '../database/databaseUrl';

export interface StartupBannerInput {
  port: number;
  /** `null` if it could not be resolved (e.g. empty DATABASE in production). */
  databaseUrl: string | null;
  /** Panel origin (the first one in CORS_ALLOWED_ORIGINS). */
  panelUrl?: string;
  /** Saba's server: login, sessions and customers (`SABA_API_URL`). */
  sabaUrl?: string;
  /** WhatsApp webhook behind the dev tunnel, to paste in Meta. */
  webhookUrl?: string;
  /** What is missing or wrong in the configuration. */
  warnings?: string[];
  color: boolean;
}

/** ANSI codes, so the box stands out among the JSON logs. */
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

/** Colors only in development: on Cloud Run they would pollute the logs. */
export function shouldColor(env: NodeJS.ProcessEnv = process.env): boolean {
  return !env.NO_COLOR && env.NODE_ENV !== 'production';
}

/**
 * What gets printed at startup, for humans: which database it runs against and
 * what can be opened. Mixing up the local database with a remote one is the expensive
 * mistake, so it goes in the title, in uppercase and in color (green local,
 * red remote). Used by the API at startup and by turbo's `dev:info` task.
 */
export function startupBanner(input: StartupBannerInput): string {
  // Unresolved only happens in production, where DATABASE is mandatory.
  const local = input.databaseUrl
    ? isLocalDatabaseUrl(input.databaseUrl)
    : false;
  const api = `http://localhost:${input.port}`;

  const rows: Row[] = [
    ...(input.panelUrl ? [{ label: 'Panel', value: input.panelUrl }] : []),
    { label: 'API', value: `${api}/api/v1` },
    { label: 'Swagger', value: `${api}/api/docs` },
    { label: 'Health', value: `${api}/api/v1/health` },
    {
      label: 'Base',
      value: input.databaseUrl
        ? redactDatabaseUrl(input.databaseUrl)
        : 'sin resolver',
    },
    ...(input.sabaUrl ? [{ label: 'Saba', value: input.sabaUrl }] : []),
    ...(input.webhookUrl
      ? [{ label: 'Webhook', value: input.webhookUrl }]
      : []),
    ...(input.warnings ?? []).map((warning) => ({
      label: '⚠',
      value: warning,
      warning: true,
    })),
  ];

  const title = local
    ? '● LOCAL · Postgres de docker-compose'
    : '▲ BASE REMOTA · datos reales, cuidado con lo que escribes';
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
  // Text is measured without colors: ANSI codes take no columns.
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
