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
  it('protects when there is a user and a password', () => {
    expect(
      resolveSwaggerAccess({ SWAGGER_USER: 'admin', SWAGGER_PASSWORD: 'x' })
    ).toEqual({
      mode: 'protected',
      credentials: { user: 'admin', password: 'x' },
    });
  });

  it('stays open in development without credentials', () => {
    expect(resolveSwaggerAccess({ NODE_ENV: 'development' })).toEqual({
      mode: 'open',
    });
  });

  it('is disabled in production without credentials (fail-closed)', () => {
    expect(
      resolveSwaggerAccess({ NODE_ENV: 'production', SWAGGER_USER: 'admin' })
    ).toEqual({ mode: 'disabled' });
  });
});

describe('isAuthorized', () => {
  it('accepts the correct credentials, even if the password contains ":"', () => {
    expect(
      isAuthorized(basic('admin', credentials.password), credentials)
    ).toBe(true);
  });

  it('rejects a wrong password or user', () => {
    expect(isAuthorized(basic('admin', 'other'), credentials)).toBe(false);
    expect(
      isAuthorized(basic('other', credentials.password), credentials)
    ).toBe(false);
  });

  it('rejects without a header or with another scheme', () => {
    expect(isAuthorized(undefined, credentials)).toBe(false);
    expect(isAuthorized('Bearer abc', credentials)).toBe(false);
  });
});
