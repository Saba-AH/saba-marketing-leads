import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HttpExceptionFilter } from '../../infrastructure/errors/HttpExceptionFilter';
import { fakeHost, fakeLogger } from '../support/fakeHttpContext';

describe('HttpExceptionFilter', () => {
  // With the domain catalog empty (the template starts that way), a message that
  // is not registered goes through as-is, keeping the HttpException's status.
  // Once a module registers its code in `domainMessages`, this same path
  // translates it into the human message without touching the filter.
  it('passes an unregistered code as-is, keeping the HttpException status', () => {
    const filter = new HttpExceptionFilter(fakeLogger());
    const { host, json, status } = fakeHost();

    filter.catch(new UnauthorizedException('AUTH_TOKEN_MISSING'), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AUTH_TOKEN_MISSING',
        error: 'AUTH_TOKEN_MISSING',
      })
    );
  });

  it('lets through a message that is not a known domain code', () => {
    const filter = new HttpExceptionFilter(fakeLogger());
    const { host, json } = fakeHost();

    filter.catch(new BadRequestException('correo inválido'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'correo inválido' })
    );
  });

  it('collapses a 5xx to INTERNAL_ERROR and does not leak the raw detail', () => {
    const logger = fakeLogger();
    const filter = new HttpExceptionFilter(logger);
    const { host, json, status } = fakeHost();

    filter.catch(
      new InternalServerErrorException('conexión con detalle sensible'),
      host
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        error: 'Ocurrió un error interno.',
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('treats any thrown value that is not an HttpException as 500', () => {
    const filter = new HttpExceptionFilter(fakeLogger());
    const { host, json, status } = fakeHost();

    filter.catch(new Error('bug inesperado'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' })
    );
  });
});
