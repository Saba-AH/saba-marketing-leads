import type { ArgumentsHost } from '@nestjs/common';
import { vi } from 'vitest';
import type { StructuredLogger } from '../../infrastructure/logging/StructuredLogger';

/** `StructuredLogger` double to test global filters without writing to stdout/stderr. */
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

/** Minimal `ArgumentsHost` double to test global filters without booting Nest. */
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
