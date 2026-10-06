import type { ArgumentsHost } from '@nestjs/common';
import { vi } from 'vitest';
import type { StructuredLogger } from '../../infrastructure/logging/StructuredLogger';

/** Doble de `StructuredLogger` para probar filtros globales sin escribir a stdout/stderr. */
export function fakeLogger(): StructuredLogger {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    event: vi.fn(),
  } as unknown as StructuredLogger;
}

/** Doble mínimo de `ArgumentsHost` para probar filtros globales sin levantar Nest. */
export function fakeHost(): {
  host: ArgumentsHost;
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
} {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/api/v1/login/sesiones' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}
