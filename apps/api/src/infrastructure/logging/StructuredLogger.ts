import { Injectable, type LoggerService } from '@nestjs/common';
import { CorrelationContext } from './CorrelationContext';
import { redact } from './logRedaction';

/** `JSON.stringify` lanza con `bigint`; se serializa como texto para no tumbar el log. */
function jsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

export type LogFields = Record<string, unknown>;

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

interface LogEntry {
  severity: Severity;
  message: string;
  timestamp: string;
  correlationId?: string;
  context?: string;
  stack_trace?: string;
  [field: string]: unknown;
}

/**
 * Logger JSON a stdout/stderr: Cloud Logging en Cloud Run parsea cada línea
 * como entrada estructurada cuando trae `severity` y `message`, sin agente ni
 * SDK aparte. Un `stack_trace` con severidad `ERROR` es también lo único que
 * Cloud Error Reporting necesita para detectar el error automáticamente.
 *
 * Implementa `LoggerService` para que Nest la use como logger global
 * (`app.useLogger`) y además queda inyectable para que el código de
 * aplicación registre eventos propios con campos estructurados (`event`),
 * p. ej. `assetId` para reconstruir la trayectoria de un activo.
 */
@Injectable()
export class StructuredLogger implements LoggerService {
  log(message: unknown, context?: string): Promise<void> {
    return this.write('INFO', message, context);
  }

  warn(message: unknown, context?: string): Promise<void> {
    return this.write('WARNING', message, context);
  }

  debug(message: unknown, context?: string): Promise<void> {
    return this.write('DEBUG', message, context);
  }

  verbose(message: unknown, context?: string): Promise<void> {
    return this.write('DEBUG', message, context);
  }

  /**
   * Devuelve una promesa que resuelve cuando la escritura en `stderr`
   * termina, para que quien reporta un error fatal (p. ej.
   * `registerUncaughtErrorHandlers`) pueda esperarla antes de matar el
   * proceso sin truncar el log.
   */
  error(message: unknown, trace?: string, context?: string): Promise<void> {
    return this.write('ERROR', message, context, trace);
  }

  /** Log estructurado de aplicación, con campos propios (p. ej. `assetId`, `batchId`). */
  event(message: string, fields: LogFields = {}): Promise<void> {
    return this.emit({
      ...fields,
      severity: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      correlationId: CorrelationContext.get(),
    });
  }

  private write(
    severity: Severity,
    message: unknown,
    context?: string,
    trace?: string
  ): Promise<void> {
    const safeMessage =
      typeof message === 'string'
        ? message
        : JSON.stringify(redact(message), jsonReplacer);
    return this.emit({
      severity,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      correlationId: CorrelationContext.get(),
      context,
      stack_trace: trace,
    });
  }

  /**
   * Único punto de salida: `redact()` corre acá, no en cada método público,
   * para que ningún camino (`log`/`warn`/`error`/`event`) pueda saltárselo —
   * un `message` o `stack_trace` con un token también se tapa, no solo los
   * campos de `event()`.
   */
  private emit(entry: LogEntry): Promise<void> {
    const redacted = redact(entry) as LogEntry;
    const line = JSON.stringify(redacted, jsonReplacer);
    const stream =
      entry.severity === 'ERROR' || entry.severity === 'WARNING'
        ? process.stderr
        : process.stdout;
    return new Promise((resolve) => {
      stream.write(`${line}\n`, () => resolve());
    });
  }
}
