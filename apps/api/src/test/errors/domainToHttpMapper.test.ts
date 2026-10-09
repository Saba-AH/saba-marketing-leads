import { describe, expect, it } from 'vitest';
import {
  domainErrorHttpStatus,
  mapDomainErrorToHttpStatus,
} from '../../infrastructure/errors/DomainToHttpMapper';
import { domainMessages } from '../../infrastructure/i18n/domainMessages';

describe('domainErrorHttpStatus', () => {
  it('covers every code translated in domainMessages', () => {
    for (const code of Object.keys(domainMessages)) {
      expect(domainErrorHttpStatus).toHaveProperty(code);
    }
  });

  it('collapses an unknown code to 500 instead of blowing up', () => {
    expect(mapDomainErrorToHttpStatus('CODE_THAT_DOES_NOT_EXIST')).toBe(500);
  });
});
