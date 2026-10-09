import { Injectable, type LoggerService } from '@nestjs/common';
import { CorrelationContext } from './CorrelationContext';
import { redact } from './logRedaction';

/** `JSON.stringify` throws on `bigint`; it is serialized as text so the log does not crash. */
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
 * JSON logger to stdout/stderr: Cloud Logging on Cloud Run parses each line as
 * a structured entry when it has `severity` and `message`, with no extra agent
 * or SDK. A `stack_trace` with `ERROR` severity is also all Cloud Error
 * Reporting needs to detect the error automatically.
 *
 * It implements `LoggerService` so Nest uses it as the global logger
 * (`app.useLogger`), and it is also injectable so application code can record
 * its own events with structured fields (`event`), e.g. `assetId` to rebuild
 * an asset's trail.
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
   * Returns a promise that resolves when the write to `stderr` finishes, so
   * whoever reports a fatal error (e.g. `registerUncaughtErrorHandlers`) can
   * wait for it before killing the process without truncating the log.
   */
  error(message: unknown, trace?: string, context?: string): Promise<void> {
    return this.write('ERROR', message, context, trace);
  }

  /** Structured application log, with its own fields (e.g. `assetId`, `batchId`). */
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
   * Single exit point: `redact()` runs here, not in each public method, so no
   * path (`log`/`warn`/`error`/`event`) can skip it — a `message` or
   * `stack_trace` carrying a token is masked too, not only the `event()` fields.
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
