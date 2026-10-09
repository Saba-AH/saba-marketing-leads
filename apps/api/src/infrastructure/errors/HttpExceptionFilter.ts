import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveDomainMessage } from '../i18n/domainMessages';
import { CorrelationContext } from '../logging/CorrelationContext';
import { StructuredLogger } from '../logging/StructuredLogger';
import { buildErrorResponseBody } from './ErrorResponseBody';
import { stackWithCauses } from './stackWithCauses';

const INTERNAL_ERROR_MESSAGE = 'Ocurrió un error interno.';

interface Resolved {
  status: HttpStatus;
  code: string;
  message: string;
}

/**
 * Last line of defense: any exception that is not a `DomainException` ends up
 * here (untyped `@Catch()`) — Nest's `HttpException` (guards,
 * `ThrottlerGuard`, `ZodValidationPipe`) and also whatever nobody expected. A
 * ≥500 never leaks its raw detail — it collapses to `INTERNAL_ERROR`
 * (`.claude/rules/errors.md`).
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();

    const resolved = this.resolve(exception);
    const isServerError = resolved.status >= HttpStatus.INTERNAL_SERVER_ERROR;

    if (isServerError) {
      const stack = stackWithCauses(exception);
      this.logger.error(
        `${resolved.code}: ${resolved.message}`,
        stack,
        'HttpExceptionFilter'
      );
    } else {
      this.logger.warn(
        `${resolved.code}: ${resolved.message}`,
        'HttpExceptionFilter'
      );
    }

    response.status(resolved.status).json(
      buildErrorResponseBody({
        code: resolved.code,
        message: resolved.message,
        path: request.url,
        correlationId: CorrelationContext.get(),
      })
    );
  }

  private resolve(exception: unknown): Resolved {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: INTERNAL_ERROR_MESSAGE,
      };
    }

    const status = exception.getStatus();
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        status,
        code: 'INTERNAL_ERROR',
        message: INTERNAL_ERROR_MESSAGE,
      };
    }

    const rawMessage = this.extractMessage(exception);
    return {
      status,
      code: rawMessage,
      message: resolveDomainMessage(rawMessage) ?? rawMessage,
    };
  }

  private extractMessage(exception: HttpException): string {
    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message;
    }
    return exception.message;
  }
}
