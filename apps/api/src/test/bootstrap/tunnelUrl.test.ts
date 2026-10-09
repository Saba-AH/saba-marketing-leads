import { describe, expect, it } from 'vitest';
import {
  findQuickTunnelUrl,
  shouldOpenTunnel,
  whatsAppWebhookUrl,
} from '../../infrastructure/bootstrap/tunnelUrl';

describe('findQuickTunnelUrl', () => {
  it('finds the public URL in the box cloudflared prints', () => {
    const output = [
      '2026-10-09T12:00:00Z INF |  Your quick Tunnel has been created! Visit it at:  |',
      '2026-10-09T12:00:00Z INF |  https://brave-otter-sunny-lake.trycloudflare.com  |',
    ].join('\n');

    expect(findQuickTunnelUrl(output)).toBe(
      'https://brave-otter-sunny-lake.trycloudflare.com'
    );
  });

  it('ignores the API endpoint cloudflared asks for the tunnel', () => {
    expect(
      findQuickTunnelUrl('Requesting new quick Tunnel on trycloudflare.com...')
    ).toBeNull();
    expect(
      findQuickTunnelUrl('POST https://api.trycloudflare.com/tunnel')
    ).toBeNull();
  });
});

describe('shouldOpenTunnel', () => {
  it('opens only in development', () => {
    expect(shouldOpenTunnel({ NODE_ENV: 'development' })).toBe(true);
    expect(shouldOpenTunnel({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldOpenTunnel({})).toBe(false);
  });
});

describe('whatsAppWebhookUrl', () => {
  it('points at the webhook route under the API prefix', () => {
    expect(whatsAppWebhookUrl('https://a-b.trycloudflare.com')).toBe(
      'https://a-b.trycloudflare.com/api/v1/whatsapp/webhook'
    );
  });
});
