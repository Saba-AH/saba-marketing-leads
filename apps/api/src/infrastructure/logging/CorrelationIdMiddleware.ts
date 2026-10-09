import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CorrelationContext } from './CorrelationContext';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Every request comes in with a correlation id: the one the caller sends in
 * `x-correlation-id` (chaining with an upstream service, e.g. the SSR client)
 * or a new one if none arrives. It is returned in the response and stored in
 * `AsyncLocalStorage` for the rest of the request.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    CorrelationContext.run(correlationId, next);
  }
}
