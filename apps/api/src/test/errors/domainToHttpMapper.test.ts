import { describe, expect, it } from 'vitest';
import {
  domainErrorHttpStatus,
  mapDomainErrorToHttpStatus,
} from '../../infrastructure/errors/DomainToHttpMapper';
import { domainMessages } from '../../infrastructure/i18n/domainMessages';

describe('domainErrorHttpStatus', () => {
  it('cubre todo código traducido en domainMessages', () => {
    for (const code of Object.keys(domainMessages)) {
      expect(domainErrorHttpStatus).toHaveProperty(code);
    }
  });

  it('colapsa un código desconocido a 500 en vez de reventar', () => {
    expect(mapDomainErrorToHttpStatus('CODIGO_QUE_NO_EXISTE')).toBe(500);
  });
});
