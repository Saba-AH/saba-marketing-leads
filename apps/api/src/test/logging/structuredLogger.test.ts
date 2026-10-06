import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CorrelationContext } from '../../infrastructure/logging/CorrelationContext';
import { StructuredLogger } from '../../infrastructure/logging/StructuredLogger';

function lastJsonLineFrom(
  spy: ReturnType<typeof vi.spyOn>
): Record<string, unknown> {
  const call = spy.mock.calls.at(-1);
  if (!call) throw new Error('el stream no recibió ninguna escritura');
  return JSON.parse(String(call[0]));
}

describe('StructuredLogger', () => {
  let stdout: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;
  let logger: StructuredLogger;

  beforeEach(() => {
    stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    logger = new StructuredLogger();
  });

  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
  });

  it('escribe INFO en stdout con severidad y mensaje', () => {
    logger.log('API arriba', 'Bootstrap');

    const entry = lastJsonLineFrom(stdout);
    expect(entry).toMatchObject({
      severity: 'INFO',
      message: 'API arriba',
      context: 'Bootstrap',
    });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('escribe ERROR en stderr con traza', () => {
    logger.error('fallo inesperado', 'Error: boom\n  at x', 'AlgunModulo');

    const entry = lastJsonLineFrom(stderr);
    expect(entry).toMatchObject({
      severity: 'ERROR',
      message: 'fallo inesperado',
      stack_trace: 'Error: boom\n  at x',
      context: 'AlgunModulo',
    });
  });

  it('incluye el correlationId del AsyncLocalStorage cuando hay uno activo', () => {
    CorrelationContext.run('corr-123', () => {
      logger.log('con contexto');
    });

    const entry = lastJsonLineFrom(stdout);
    expect(entry.correlationId).toBe('corr-123');
  });

  it('no incluye correlationId fuera de un request', () => {
    logger.log('sin contexto');

    const entry = lastJsonLineFrom(stdout);
    expect(entry.correlationId).toBeUndefined();
  });

  it('event() tapa campos sensibles y agrega los campos propios', () => {
    logger.event('ingesta procesada', {
      assetId: 'a1',
      password: 'no-deberia-salir',
    });

    const entry = lastJsonLineFrom(stdout);
    expect(entry).toMatchObject({
      severity: 'INFO',
      message: 'ingesta procesada',
      assetId: 'a1',
      password: '[REDACTED]',
    });
  });

  it('event() no permite que fields sobrescriba severity, message ni correlationId', () => {
    CorrelationContext.run('corr-real', () => {
      logger.event('ingesta procesada', {
        severity: 'ERROR',
        message: 'suplantado',
        correlationId: 'corr-falso',
        timestamp: 'falso',
      });
    });

    const entry = lastJsonLineFrom(stdout);
    expect(entry).toMatchObject({
      severity: 'INFO',
      message: 'ingesta procesada',
      correlationId: 'corr-real',
    });
    expect(entry.timestamp).not.toBe('falso');
  });

  it('tapa un objeto no-string en el mensaje antes de serializarlo', () => {
    logger.log({ evento: 'login', password: 'no-deberia-salir' });

    const entry = lastJsonLineFrom(stdout);
    expect(entry.message).not.toContain('no-deberia-salir');
    expect(JSON.parse(String(entry.message))).toMatchObject({
      evento: 'login',
      password: '[REDACTED]',
    });
  });

  it('tapa un token filtrado en el mensaje de error() y en la traza, no solo en event()', () => {
    logger.error(
      'fallo al llamar con Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature',
      'Error: boom\n  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature',
      'AlgunModulo'
    );

    const entry = lastJsonLineFrom(stderr);
    expect(entry.message).toBe('fallo al llamar con Bearer [REDACTED]');
    expect(entry.stack_trace).toBe(
      'Error: boom\n  Authorization: Bearer [REDACTED]'
    );
  });

  it('serializa un bigint como texto en vez de lanzar', () => {
    expect(() =>
      logger.event('con bigint', { size: 9007199254740993n })
    ).not.toThrow();

    const entry = lastJsonLineFrom(stdout);
    expect(entry.size).toBe('9007199254740993');
  });
});
