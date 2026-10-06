import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CorrelationContext } from './CorrelationContext';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Todo request entra con un id de correlación: el que traiga el caller en
 * `x-correlation-id` (encadena con un servicio previo, p. ej. el cliente SSR)
 * o uno nuevo si no llega ninguno. Se devuelve en la respuesta y se guarda en
 * `AsyncLocalStorage` para el resto del request.
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
