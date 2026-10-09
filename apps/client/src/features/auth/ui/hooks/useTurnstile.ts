'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** Cloudflare test key that always validates (the production one rejects localhost). */
const TEST_SITE_KEY = '1x00000000000000000000AA';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

function turnstileApi(): TurnstileApi | undefined {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

function loadScript(): Promise<void> {
  if (turnstileApi()) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  );
  const script = existing ?? document.createElement('script');
  const loaded = new Promise<void>((resolve) => {
    script.addEventListener('load', () => resolve(), { once: true });
  });
  if (!existing) {
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }
  return loaded;
}

/**
 * Cloudflare Turnstile widget. The token is single-use: after a failed attempt
 * `reset` has to be called to get another one.
 */
export function useTurnstile(): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  token: string | null;
  reset: () => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadScript().then(() => {
      const api = turnstileApi();
      if (cancelled || !api || !containerRef.current) return;
      widgetId.current = api.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (next: string) => setToken(next),
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
        language: 'es',
      });
    });
    return () => {
      cancelled = true;
      if (widgetId.current) turnstileApi()?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId.current) turnstileApi()?.reset(widgetId.current);
  }, []);

  return { containerRef, token, reset };
}
