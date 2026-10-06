import { describe, expect, it } from 'vitest';
import { redact } from '../../infrastructure/logging/logRedaction';

describe('redact', () => {
  it('tapa el valor de claves sensibles sin importar mayúsculas o anidamiento', () => {
    const result = redact({
      correo: 'a@example.com',
      password: 'super-secreta',
      auth: { token: 'abc.def.ghi', Authorization: 'Bearer abc.def.ghi' },
    });

    expect(result).toEqual({
      correo: 'a@example.com',
      password: '[REDACTED]',
      auth: { token: '[REDACTED]', Authorization: '[REDACTED]' },
    });
  });

  it('tapa un bearer token dentro de un string libre', () => {
    const result = redact(
      'llamada rechazada, header: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature'
    );

    expect(result).toBe('llamada rechazada, header: Bearer [REDACTED]');
  });

  it('tapa un bearer opaco (no JWT) dentro de un string libre', () => {
    const result = redact('llamada rechazada, header: Bearer tok_opaco_xyz123');

    expect(result).toBe('llamada rechazada, header: Bearer [REDACTED]');
  });

  it('tapa credenciales Basic en la cabecera Authorization', () => {
    const result = redact('rechazado, Authorization: Basic dXNlcjpwYXNz');

    expect(result).toBe('rechazado, Authorization: [REDACTED]');
  });

  it('tapa el valor de una cabecera X-API-Key en texto libre', () => {
    const result = redact('llamada con X-API-Key: abc123def4567890');

    expect(result).toBe('llamada con X-API-Key: [REDACTED]');
  });

  it('tapa la query de una URL firmada mas conserva origen y ruta', () => {
    const result = redact(
      'subida a https://storage.googleapis.com/originals/foto.jpg?X-Goog-Signature=abc123&X-Goog-Expires=600'
    );

    expect(result).toBe(
      'subida a https://storage.googleapis.com/originals/foto.jpg?[REDACTED]'
    );
  });

  it('recorre arreglos preservando el resto de los valores', () => {
    const result = redact([{ password: 'x' }, { correo: 'a@example.com' }]);

    expect(result).toEqual([
      { password: '[REDACTED]' },
      { correo: 'a@example.com' },
    ]);
  });

  it('no revienta con referencias circulares', () => {
    const value: Record<string, unknown> = { name: 'ciclo' };
    value.self = value;

    expect(() => redact(value)).not.toThrow();
  });

  it('tapa el valor completo de Authorization con esquemas que no son Bearer', () => {
    expect(redact('Authorization: Token secreto-123')).toBe(
      'Authorization: [REDACTED]'
    );
    expect(redact('Authorization: Basic dXNlcjpwYXNz')).toBe(
      'Authorization: [REDACTED]'
    );
  });
});
