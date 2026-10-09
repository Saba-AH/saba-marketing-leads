import { describe, expect, it } from 'vitest';
import { DomainException } from '../../infrastructure/errors/DomainException';
import { DomainExceptionFilter } from '../../infrastructure/errors/DomainExceptionFilter';
import { CorrelationContext } from '../../infrastructure/logging/CorrelationContext';
import { fakeHost, fakeLogger } from '../support/fakeHttpContext';

// The template starts with an empty domain message catalog. Until a module
// registers its code in `domainMessages` + `DomainToHttpMapper`, every
// `DomainException` falls into the unregistered-code path.
class UnregisteredCodeError extends DomainException {
  constructor() {
    super('MODULE_UNKNOWN_CODE');
  }
}

describe('DomainExceptionFilter', () => {
  it('builds the contract error envelope (success:false, path)', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json } = fakeHost();

    filter.catch(new UnregisteredCodeError(), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        path: '/api/v1/login/sesiones',
      })
    );
  });

  it('attaches the active correlationId from AsyncLocalStorage', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json } = fakeHost();

    CorrelationContext.run('corr-abc', () => {
      filter.catch(new UnregisteredCodeError(), host);
    });

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'corr-abc' })
    );
  });

  it('collapses an unregistered code to INTERNAL_ERROR and never leaks the detail', () => {
    const logger = fakeLogger();
    const filter = new DomainExceptionFilter(logger);
    const { host, json, status } = fakeHost();

    filter.catch(new UnregisteredCodeError(), host);

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
