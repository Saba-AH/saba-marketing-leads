import { describe, expect, it } from 'vitest';
import {
  isAuthorized,
  resolveSwaggerAccess,
} from '../../infrastructure/swagger/swaggerBasicAuth';

const credentials = { user: 'admin', password: 's3cr3t:con:dos-puntos' };

function basic(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

describe('resolveSwaggerAccess', () => {
  it('protege cuando hay usuario y contraseña', () => {
    expect(
      resolveSwaggerAccess({ SWAGGER_USER: 'admin', SWAGGER_PASSWORD: 'x' })
    ).toEqual({
      mode: 'protected',
      credentials: { user: 'admin', password: 'x' },
    });
  });

  it('queda abierto en desarrollo sin credenciales', () => {
    expect(resolveSwaggerAccess({ NODE_ENV: 'development' })).toEqual({
      mode: 'open',
    });
  });

  it('se desactiva en producción sin credenciales (fail-closed)', () => {
    expect(
      resolveSwaggerAccess({ NODE_ENV: 'production', SWAGGER_USER: 'admin' })
    ).toEqual({ mode: 'disabled' });
  });
});

describe('isAuthorized', () => {
  it('acepta las credenciales correctas, aunque la contraseña tenga ":"', () => {
    expect(
      isAuthorized(basic('admin', credentials.password), credentials)
    ).toBe(true);
  });

  it('rechaza contraseña o usuario incorrectos', () => {
    expect(isAuthorized(basic('admin', 'otra'), credentials)).toBe(false);
    expect(isAuthorized(basic('otro', credentials.password), credentials)).toBe(
      false
    );
  });

  it('rechaza sin header o con otro esquema', () => {
    expect(isAuthorized(undefined, credentials)).toBe(false);
    expect(isAuthorized('Bearer abc', credentials)).toBe(false);
  });
});
