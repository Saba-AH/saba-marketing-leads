import type { StructuredLogger } from './StructuredLogger';

/**
 * `uncaughtException`/`unhandledRejection` no deberían pasar en código
 * correcto, pero si pasan el proceso queda en estado indefinido: los logueamos
 * con traza completa (severidad ERROR → Cloud Error Reporting los detecta
 * solo) antes de salir, para que Cloud Run reinicie la instancia sobre un
 * estado limpio en vez de seguir sirviendo tráfico corrupto.
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
