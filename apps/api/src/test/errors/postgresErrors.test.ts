import { describe, expect, it } from 'vitest';
import {
  constraintViolado,
  esViolacionDeUnicidad,
} from '../../infrastructure/database/postgresErrors';

/**
 * La forma del error viene del driver `pg`, verificada contra Postgres: una
 * violación de unicidad llega con `code: '23505'` y el nombre del índice en
 * `constraint`.
 */
function errorDeUnicidad(constraint: string): unknown {
  return Object.assign(new Error('duplicate key value'), {
    code: '23505',
    constraint,
    table: 'alias_entra',
  });
}

describe('esViolacionDeUnicidad', () => {
  it('reconoce el 23505', () => {
    expect(esViolacionDeUnicidad(errorDeUnicidad('cualquiera'))).toBe(true);
  });

  it('no confunde otros errores de la base', () => {
    const violacionDeFk = Object.assign(new Error('fk'), { code: '23503' });
    expect(esViolacionDeUnicidad(violacionDeFk)).toBe(false);
  });

  it('tolera lo que no es un error de Postgres', () => {
    expect(esViolacionDeUnicidad(new Error('boom'))).toBe(false);
    expect(esViolacionDeUnicidad(null)).toBe(false);
    expect(esViolacionDeUnicidad('texto')).toBe(false);
  });
});

describe('constraintViolado', () => {
  it('devuelve el índice que se violó', () => {
    expect(constraintViolado(errorDeUnicidad('alias_entra_valor_unique'))).toBe(
      'alias_entra_valor_unique'
    );
  });

  it('no devuelve nada si el error no es de unicidad', () => {
    const violacionDeFk = Object.assign(new Error('fk'), {
      code: '23503',
      constraint: 'alias_entra_unidad_id_unidades_id_fk',
    });
    // El nombre está, pero traducirlo como duplicado sería mentir sobre la causa.
    expect(constraintViolado(violacionDeFk)).toBeUndefined();
  });

  it('no rompe si el driver no adjuntó el nombre', () => {
    const sinConstraint = Object.assign(new Error('dup'), { code: '23505' });
    expect(constraintViolado(sinConstraint)).toBeUndefined();
  });
});
