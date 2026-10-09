import { AsyncLocalStorage } from 'node:async_hooks';

interface CorrelationStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

/**
 * Per-request correlation id, propagated with `AsyncLocalStorage`: any code
 * down the chain (use case, adapter, a future Vertex call) reads it with
 * `CorrelationContext.get()` without it being passed as a parameter.
 * `CorrelationIdMiddleware` sets it up; a future Eventarc/Pub/Sub consumer must
 * wrap its handler with `run()` using the id that comes in the message so the
 * asset's trail can be rebuilt end to end.
 */
export const CorrelationContext = {
  run<T>(correlationId: string, callback: () => T): T {
    return storage.run({ correlationId }, callback);
  },

  get(): string | undefined {
    return storage.getStore()?.correlationId;
  },
};
