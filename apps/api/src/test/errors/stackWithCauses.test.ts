import { describe, expect, it } from 'vitest';
import { stackWithCauses } from '../../infrastructure/errors/stackWithCauses';

describe('stackWithCauses', () => {
  it('includes the chained cause with its code (e.g. the pg error under Drizzle)', () => {
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

  it('returns undefined if it is not an Error', () => {
    expect(stackWithCauses('text')).toBeUndefined();
  });
});
