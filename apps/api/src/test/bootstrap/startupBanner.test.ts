import { describe, expect, it } from 'vitest';
import {
  shouldColor,
  startupBanner,
} from '../../infrastructure/bootstrap/startupBanner';

const LOCAL_DB = 'postgresql://postgres:postgres@localhost:5434/app_dev';
const REMOTE_DB = 'postgresql://app:s3cret-value@10.0.3.17:5432/app_prod';

const BASE = {
  port: 8080,
  panelUrl: 'http://localhost:3002',
  color: false,
};

describe('startupBanner', () => {
  it('locally says LOCAL and lists what can be opened', () => {
    const banner = startupBanner({ ...BASE, databaseUrl: LOCAL_DB });

    expect(banner).toContain('● LOCAL');
    expect(banner).toMatch(/│ Panel\s+http:\/\/localhost:3002\s+│/);
    expect(banner).toContain('http://localhost:8080/api/v1');
    expect(banner).toContain('http://localhost:8080/api/docs');
    expect(banner).toContain('postgresql://***@localhost:5434/app_dev');
    expect(banner).not.toContain('postgres:postgres');
  });

  it('shows the WhatsApp webhook when the dev tunnel is open', () => {
    const banner = startupBanner({
      ...BASE,
      databaseUrl: LOCAL_DB,
      webhookUrl: 'https://a-b.trycloudflare.com/api/v1/whatsapp/webhook',
    });

    expect(banner).toMatch(
      /│ Webhook\s+https:\/\/a-b\.trycloudflare\.com\/api\/v1\/whatsapp\/webhook\s+│/
    );
  });

  it('against a remote database warns it is real data and hides the password', () => {
    const banner = startupBanner({ ...BASE, databaseUrl: REMOTE_DB });

    expect(banner).toContain('▲ BASE REMOTA');
    expect(banner).toContain('datos reales');
    expect(banner).not.toContain('s3cret-value');
  });

  it('shows which Saba sessions are validated against', () => {
    const banner = startupBanner({
      ...BASE,
      databaseUrl: LOCAL_DB,
      sabaUrl: 'http://localhost:3001',
    });

    expect(banner).toMatch(/│ Saba\s+http:\/\/localhost:3001/);
  });

  it('draws an even box', () => {
    const lines = startupBanner({ ...BASE, databaseUrl: LOCAL_DB })
      .split('\n')
      .filter((line) => line.trim());

    expect(lines[0]?.trim()).toMatch(/^╭─ .*╮$/);
    expect(lines.at(-1)?.trim()).toMatch(/^╰─+╯$/);
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
  });

  it('shows the warnings and keeps reporting even if the database cannot be resolved', () => {
    const banner = startupBanner({
      ...BASE,
      databaseUrl: null,
      warnings: ['DATABASE está vacía'],
    });

    expect(banner).toContain('sin resolver');
    expect(banner).toContain('⚠ DATABASE está vacía');
  });

  it('colors green locally and red against a remote database', () => {
    const local = startupBanner({
      ...BASE,
      databaseUrl: LOCAL_DB,
      color: true,
    });
    const remote = startupBanner({
      ...BASE,
      databaseUrl: REMOTE_DB,
      color: true,
    });

    expect(local).toContain('\u001b[32m');
    expect(remote).toContain('\u001b[31m');
  });
});

describe('shouldColor', () => {
  it('does not color in production nor with NO_COLOR', () => {
    expect(shouldColor({ NODE_ENV: 'development' })).toBe(true);
    expect(shouldColor({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldColor({ NO_COLOR: '1' })).toBe(false);
  });
});
