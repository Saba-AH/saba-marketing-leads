import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { allowedOrigins } from '../src/infrastructure/bootstrap/allowedOrigins';
import {
  shouldColor,
  startupBanner,
} from '../src/infrastructure/bootstrap/startupBanner';
import {
  findQuickTunnelUrl,
  shouldOpenTunnel,
  whatsAppWebhookUrl,
} from '../src/infrastructure/bootstrap/tunnelUrl';
import { resolveDatabaseUrl } from '../src/infrastructure/database/databaseUrl';
import { loadSabaApiConfig } from '../src/infrastructure/saba/sabaApi';
import { loadAuthConfig } from '../src/modules/auth/infrastructure/authConfig';

/**
 * Turbo sidebar task `@repo/api#dev:info`: the same summary the API prints at
 * startup, on its own and without logs on top. It reads the same `.env` as the
 * API, so it shows what it will run against, and warns about what is missing
 * before the API crashes. In development it also keeps a Cloudflare quick
 * tunnel open so Meta can reach the WhatsApp webhook; the subdomain changes on
 * every run, so the summary shows the one to paste.
 */
loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

const TUNNEL_TIMEOUT_MS = 30_000;
const port = Number(process.env.PORT) || 8080;

const warnings: string[] = [];
function attempt<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch (error: unknown) {
    warnings.push(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/** Resolves with the public URL, or `undefined` (and a warning) if it never comes. */
function openTunnel(): Promise<string | undefined> {
  return new Promise((done) => {
    const tunnel = spawn(
      'cloudflared',
      ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let settled = false;
    const settle = (url?: string, warning?: string): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (warning) warnings.push(warning);
      done(url);
    };
    const timer = setTimeout(
      () => settle(undefined, 'cloudflared no dio la URL del túnel a tiempo'),
      TUNNEL_TIMEOUT_MS
    );

    // cloudflared logs everything, the URL included, to stderr.
    tunnel.stderr.on('data', (chunk: Buffer) => {
      const url = findQuickTunnelUrl(chunk.toString());
      if (url) settle(url);
    });
    tunnel.on('error', () =>
      settle(
        undefined,
        'Sin túnel: instala cloudflared (brew install cloudflared)'
      )
    );
    tunnel.on('exit', (code) => {
      // Before the URL: still print the summary, with the reason. After it:
      // the task dies with the tunnel, so the sidebar shows it is gone.
      if (settled) process.exit(code ?? 0);
      settle(undefined, `cloudflared terminó (código ${code ?? '?'})`);
    });
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.on(signal, () => tunnel.kill(signal));
    }
  });
}

async function main(): Promise<void> {
  const databaseUrl = attempt(() => resolveDatabaseUrl()) ?? null;
  // The API does not start without these: better to see it here with the reason.
  const saba = attempt(() => loadSabaApiConfig());
  attempt(() => loadAuthConfig());

  const tunnelUrl = shouldOpenTunnel() ? await openTunnel() : undefined;

  console.log(
    startupBanner({
      port,
      databaseUrl,
      panelUrl: allowedOrigins()[0],
      sabaUrl: saba?.apiUrl,
      webhookUrl: tunnelUrl ? whatsAppWebhookUrl(tunnelUrl) : undefined,
      warnings,
      // Turbo does not give the task a TTY, but its TUI shows colors.
      color: shouldColor(),
    })
  );
}

void main();
