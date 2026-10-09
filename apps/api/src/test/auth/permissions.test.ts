import { describe, expect, it } from 'vitest';
import { satisfies } from '../../modules/auth/domain/permissions';

describe('satisfies', () => {
  it('asks for every permission by default', () => {
    expect(
      satisfies(['marketing:access'], { permissions: ['marketing:access'] })
    ).toBe(true);
    expect(satisfies([], { permissions: ['marketing:access'] })).toBe(false);
  });

  it('with OR, one permission is enough', () => {
    expect(
      satisfies(['marketing:access'], {
        operator: 'OR',
        permissions: ['marketing:access'],
      })
    ).toBe(true);
    expect(
      satisfies([], { operator: 'OR', permissions: ['marketing:access'] })
    ).toBe(false);
  });
});
