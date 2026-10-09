import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerUncaughtErrorHandlers } from '../../infrastructure/logging/registerUncaughtErrorHandlers';
import type { StructuredLogger } from '../../infrastructure/logging/StructuredLogger';

describe('registerUncaughtErrorHandlers', () => {
  const uncaughtBefore = process.listeners('uncaughtException');
  const rejectionBefore = process.listeners('unhandledRejection');

  afterEach(() => {
    for (const listener of process.listeners('uncaughtException')) {
      if (!uncaughtBefore.includes(listener)) {
        process.removeListener('uncaughtException', listener as never);
      }
    }
    for (const listener of process.listeners('unhandledRejection')) {
      if (!rejectionBefore.includes(listener)) {
        process.removeListener('unhandledRejection', listener as never);
      }
    }
  });

  it('waits for the log to finish writing before ending the process', async () => {
    let resolveWrite: () => void = () => undefined;
    const error = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        })
    );
    const logger = { error } as unknown as StructuredLogger;
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    registerUncaughtErrorHandlers(logger);
    process.emit('uncaughtException', new Error('boom'));

    await Promise.resolve();
    expect(exit).not.toHaveBeenCalled();

    resolveWrite();
    await Promise.resolve();
    await Promise.resolve();

    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});
