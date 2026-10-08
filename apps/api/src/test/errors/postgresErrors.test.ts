import { describe, expect, it } from 'vitest';
import {
  isUniqueViolation,
  violatedConstraint,
} from '../../infrastructure/database/postgresErrors';

/**
 * The error's shape comes from the `pg` driver, checked against Postgres: a
 * uniqueness violation arrives with `code: '23505'` and the index name in
 * `constraint`.
 */
function uniquenessError(constraint: string): unknown {
  return Object.assign(new Error('duplicate key value'), {
    code: '23505',
    constraint,
    table: 'alias_entra',
  });
}

describe('isUniqueViolation', () => {
  it('recognizes 23505', () => {
    expect(isUniqueViolation(uniquenessError('cualquiera'))).toBe(true);
  });

  it('does not confuse other database errors', () => {
    const fkViolation = Object.assign(new Error('fk'), { code: '23503' });
    expect(isUniqueViolation(fkViolation)).toBe(false);
  });

  it('tolerates what is not a Postgres error', () => {
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('text')).toBe(false);
  });
});

describe('violatedConstraint', () => {
  it('returns the index that was violated', () => {
    expect(
      violatedConstraint(uniquenessError('alias_entra_valor_unique'))
    ).toBe('alias_entra_valor_unique');
  });

  it('returns nothing if the error is not a uniqueness one', () => {
    const fkViolation = Object.assign(new Error('fk'), {
      code: '23503',
      constraint: 'alias_entra_unidad_id_unidades_id_fk',
    });
    // The name is there, but translating it as a duplicate would lie about the cause.
    expect(violatedConstraint(fkViolation)).toBeUndefined();
  });

  it('does not break if the driver did not attach the name', () => {
    const withoutConstraint = Object.assign(new Error('dup'), {
      code: '23505',
    });
    expect(violatedConstraint(withoutConstraint)).toBeUndefined();
  });
});
