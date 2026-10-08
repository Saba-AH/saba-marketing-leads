import type { StructuredLogger } from './StructuredLogger';

/**
 * `uncaughtException`/`unhandledRejection` should not happen in correct code,
 * but if they do the process is left in an undefined state: we log them with
 * the full trace (ERROR severity → Cloud Error Reporting picks them up on its
 * own) before exiting, so Cloud Run restarts the instance on a clean state
 * instead of keeping on serving corrupt traffic.
 */
export function registerUncaughtErrorHandlers(logger: StructuredLogger): void {
  process.on('uncaughtException', (error: Error) => {
    void logger
      .error(error.message, error.stack, 'UncaughtException')
      .finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    void logger
      .error(error.message, error.stack, 'UnhandledRejection')
      .finally(() => process.exit(1));
  });
}
