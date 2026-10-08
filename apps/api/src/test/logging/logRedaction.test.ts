import { describe, expect, it } from 'vitest';
import { redact } from '../../infrastructure/logging/logRedaction';

describe('redact', () => {
  it('masks the value of sensitive keys regardless of case or nesting', () => {
    const result = redact({
      email: 'a@example.com',
      password: 'super-secreta',
      auth: { token: 'abc.def.ghi', Authorization: 'Bearer abc.def.ghi' },
    });

    expect(result).toEqual({
      email: 'a@example.com',
      password: '[REDACTED]',
      auth: { token: '[REDACTED]', Authorization: '[REDACTED]' },
    });
  });

  it('masks a bearer token inside a free string', () => {
    const result = redact(
      'llamada rechazada, header: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature'
    );

    expect(result).toBe('llamada rechazada, header: Bearer [REDACTED]');
  });

  it('masks an opaque bearer (not a JWT) inside a free string', () => {
    const result = redact('llamada rechazada, header: Bearer tok_opaco_xyz123');

    expect(result).toBe('llamada rechazada, header: Bearer [REDACTED]');
  });

  it('masks Basic credentials in the Authorization header', () => {
    const result = redact('rechazado, Authorization: Basic dXNlcjpwYXNz');

    expect(result).toBe('rechazado, Authorization: [REDACTED]');
  });

  it('masks the value of an X-API-Key header in free text', () => {
    const result = redact('llamada con X-API-Key: abc123def4567890');

    expect(result).toBe('llamada con X-API-Key: [REDACTED]');
  });

  it('masks the query of a signed URL but keeps origin and path', () => {
    const result = redact(
      'subida a https://storage.googleapis.com/originals/foto.jpg?X-Goog-Signature=abc123&X-Goog-Expires=600'
    );

    expect(result).toBe(
      'subida a https://storage.googleapis.com/originals/foto.jpg?[REDACTED]'
    );
  });

  it('walks arrays keeping the rest of the values', () => {
    const result = redact([{ password: 'x' }, { email: 'a@example.com' }]);

    expect(result).toEqual([
      { password: '[REDACTED]' },
      { email: 'a@example.com' },
    ]);
  });

  it('does not blow up with circular references', () => {
    const value: Record<string, unknown> = { name: 'ciclo' };
    value.self = value;

    expect(() => redact(value)).not.toThrow();
  });

  it('masks the whole Authorization value with schemes that are not Bearer', () => {
    expect(redact('Authorization: Token secreto-123')).toBe(
      'Authorization: [REDACTED]'
    );
    expect(redact('Authorization: Basic dXNlcjpwYXNz')).toBe(
      'Authorization: [REDACTED]'
    );
  });
});
