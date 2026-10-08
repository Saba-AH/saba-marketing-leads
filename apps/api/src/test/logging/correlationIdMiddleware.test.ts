import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { CorrelationContext } from '../../infrastructure/logging/CorrelationContext';
import {
  CORRELATION_ID_HEADER,
  CorrelationIdMiddleware,
} from '../../infrastructure/logging/CorrelationIdMiddleware';

function fakeRequest(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function fakeResponse(): Response & { headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  } as unknown as Response & { headers: Record<string, string> };
}

describe('CorrelationIdMiddleware', () => {
  it('reuses the x-correlation-id the request brings', () => {
    const middleware = new CorrelationIdMiddleware();
    const req = fakeRequest({ [CORRELATION_ID_HEADER]: 'ya-existente' });
    const res = fakeResponse();
    let seenInsideContext: string | undefined;

    middleware.use(req, res, () => {
      seenInsideContext = CorrelationContext.get();
    });

    expect(seenInsideContext).toBe('ya-existente');
    expect(res.headers[CORRELATION_ID_HEADER]).toBe('ya-existente');
  });

  it('generates a new id when none arrives', () => {
    const middleware = new CorrelationIdMiddleware();
    const req = fakeRequest();
    const res = fakeResponse();
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.headers[CORRELATION_ID_HEADER]).toEqual(expect.any(String));
    expect(res.headers[CORRELATION_ID_HEADER].length).toBeGreaterThan(0);
  });
});
