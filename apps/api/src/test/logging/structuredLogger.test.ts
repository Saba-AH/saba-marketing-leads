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

  it('writes INFO to stdout with severity and message', () => {
    logger.log('API arriba', 'Bootstrap');

    const entry = lastJsonLineFrom(stdout);
    expect(entry).toMatchObject({
      severity: 'INFO',
      message: 'API arriba',
      context: 'Bootstrap',
    });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('writes ERROR to stderr with a trace', () => {
    logger.error('fallo inesperado', 'Error: boom\n  at x', 'AlgunModulo');

    const entry = lastJsonLineFrom(stderr);
    expect(entry).toMatchObject({
      severity: 'ERROR',
      message: 'fallo inesperado',
      stack_trace: 'Error: boom\n  at x',
      context: 'AlgunModulo',
    });
  });

  it('includes the AsyncLocalStorage correlationId when one is active', () => {
    CorrelationContext.run('corr-123', () => {
      logger.log('con contexto');
    });

    const entry = lastJsonLineFrom(stdout);
    expect(entry.correlationId).toBe('corr-123');
  });

  it('does not include correlationId outside a request', () => {
    logger.log('sin contexto');

    const entry = lastJsonLineFrom(stdout);
    expect(entry.correlationId).toBeUndefined();
  });

  it('event() masks sensitive fields and adds its own fields', () => {
    logger.event('ingesta procesada', {
      assetId: 'a1',
      password: 'must-not-leak',
    });

    const entry = lastJsonLineFrom(stdout);
    expect(entry).toMatchObject({
      severity: 'INFO',
      message: 'ingesta procesada',
      assetId: 'a1',
      password: '[REDACTED]',
    });
  });

  it('event() does not let fields overwrite severity, message or correlationId', () => {
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

  it('masks a non-string object in the message before serializing it', () => {
    logger.log({ event: 'login', password: 'must-not-leak' });

    const entry = lastJsonLineFrom(stdout);
    expect(entry.message).not.toContain('must-not-leak');
    expect(JSON.parse(String(entry.message))).toMatchObject({
      event: 'login',
      password: '[REDACTED]',
    });
  });

  it('masks a token leaked in the error() message and in the trace, not only in event()', () => {
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

  it('serializes a bigint as text instead of throwing', () => {
    expect(() =>
      logger.event('con bigint', { size: 9007199254740993n })
    ).not.toThrow();

    const entry = lastJsonLineFrom(stdout);
    expect(entry.size).toBe('9007199254740993');
  });
});
