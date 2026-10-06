import { describe, expect, it } from 'vitest';
import { stackWithCauses } from '../../infrastructure/errors/stackWithCauses';

describe('stackWithCauses', () => {
  it('incluye la causa encadenada con su código (p. ej. el error de pg bajo Drizzle)', () => {
    const pgError = Object.assign(new Error('getaddrinfo ENOTFOUND db.x'), {
      code: 'ENOTFOUND',
    });
    const drizzleError = new Error('Failed query: select 1', {
      cause: pgError,
    });

    const stack = stackWithCauses(drizzleError);

    expect(stack).toContain('Failed query: select 1');
    expect(stack).toContain(
      'Caused by [ENOTFOUND]: Error: getaddrinfo ENOTFOUND db.x'
    );
  });

  it('devuelve undefined si no es un Error', () => {
    expect(stackWithCauses('texto')).toBeUndefined();
  });
});
