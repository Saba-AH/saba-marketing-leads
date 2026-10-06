import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HttpExceptionFilter } from '../../infrastructure/errors/HttpExceptionFilter';
import { fakeHost, fakeLogger } from '../support/fakeHttpContext';

describe('HttpExceptionFilter', () => {
  // Con el catálogo de dominio vacío (el template arranca así), un mensaje que
  // no está registrado pasa tal cual, conservando el estado del HttpException.
  // Cuando un módulo registre su código en `domainMessages`, este mismo camino
  // lo traduce al mensaje humano sin tocar el filtro.
  it('pasa un código no registrado tal cual, conservando el estado del HttpException', () => {
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

  it('deja pasar un mensaje que no es un código de dominio conocido', () => {
    const filter = new HttpExceptionFilter(fakeLogger());
    const { host, json } = fakeHost();

    filter.catch(new BadRequestException('correo inválido'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'correo inválido' })
    );
  });

  it('colapsa un 5xx a INTERNAL_ERROR y no filtra el detalle crudo', () => {
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

  it('trata cualquier valor lanzado que no sea HttpException como 500', () => {
    const filter = new HttpExceptionFilter(fakeLogger());
    const { host, json, status } = fakeHost();

    filter.catch(new Error('bug inesperado'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' })
    );
  });
});
