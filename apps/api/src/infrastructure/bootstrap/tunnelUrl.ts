// `cloudflared` also logs api.trycloudflare.com and docs links: only a random
// subdomain is the quick tunnel's public URL.
const QUICK_TUNNEL_URL = /https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/;

/** The quick tunnel's public URL, if this chunk of `cloudflared` output has it. */
export function findQuickTunnelUrl(output: string): string | null {
  return output.match(QUICK_TUNNEL_URL)?.[0] ?? null;
}

/** The tunnel only makes sense while developing against Meta's webhook. */
export function shouldOpenTunnel(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.NODE_ENV === 'development';
}

export function whatsAppWebhookUrl(tunnelUrl: string): string {
  return `${tunnelUrl}/api/v1/whatsapp/webhook`;
}
