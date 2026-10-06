import { describe, expect, it } from 'vitest';
import { DomainException } from '../../infrastructure/errors/DomainException';
import { DomainExceptionFilter } from '../../infrastructure/errors/DomainExceptionFilter';
import { CorrelationContext } from '../../infrastructure/logging/CorrelationContext';
import { fakeHost, fakeLogger } from '../support/fakeHttpContext';

// El template arranca con el catálogo de mensajes de dominio vacío. Hasta que un
// módulo registre su código en `domainMessages` + `DomainToHttpMapper`, toda
// `DomainException` cae al camino de código no registrado.
class CodigoSinRegistrarError extends DomainException {
  constructor() {
    super('MODULO_CODIGO_INEXISTENTE');
  }
}

describe('DomainExceptionFilter', () => {
  it('arma el sobre de error del contrato (success:false, path)', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json } = fakeHost();

    filter.catch(new CodigoSinRegistrarError(), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        path: '/api/v1/login/sesiones',
      })
    );
  });

  it('adjunta el correlationId activo en AsyncLocalStorage', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json } = fakeHost();

    CorrelationContext.run('corr-abc', () => {
      filter.catch(new CodigoSinRegistrarError(), host);
    });

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'corr-abc' })
    );
  });

  it('colapsa un código sin registrar a INTERNAL_ERROR y nunca filtra el detalle', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json, status } = fakeHost();

    filter.catch(new CodigoSinRegistrarError(), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        error: 'Ocurrió un error interno.',
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
