import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveDomainMessage } from '../i18n/domainMessages';
import { CorrelationContext } from '../logging/CorrelationContext';
import { StructuredLogger } from '../logging/StructuredLogger';
import { DomainException } from './DomainException';
import { mapDomainErrorToHttpStatus } from './DomainToHttpMapper';
import { buildErrorResponseBody } from './ErrorResponseBody';
import { stackWithCauses } from './stackWithCauses';

const INTERNAL_ERROR_MESSAGE = 'Ocurrió un error interno.';

/**
 * Translates every `DomainException` into the contract's HTTP response: the
 * domain code never goes out as-is unless it already is the message meant to
 * be shown — the human translation lives in `domainMessages`
 * (`.claude/rules/errors.md`).
 */
@Injectable()
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();

    const code = exception.message;
    const status = mapDomainErrorToHttpStatus(code);
    const isServerError = status >= HttpStatus.INTERNAL_SERVER_ERROR;
    const humanMessage = resolveDomainMessage(code) ?? code;

    if (isServerError) {
      this.logger.error(
        `${code}: sin traducción o mapeada a 5xx`,
        stackWithCauses(exception),
        'DomainExceptionFilter'
      );
    } else {
      this.logger.warn(`${code}: ${humanMessage}`, 'DomainExceptionFilter');
    }

    response.status(status).json(
      buildErrorResponseBody({
        code: isServerError ? 'INTERNAL_ERROR' : code,
        message: isServerError ? INTERNAL_ERROR_MESSAGE : humanMessage,
        path: request.url,
        correlationId: CorrelationContext.get(),
      })
    );
  }
}
