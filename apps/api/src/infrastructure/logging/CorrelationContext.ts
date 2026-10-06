import { AsyncLocalStorage } from 'node:async_hooks';

interface CorrelationStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

/**
 * Id de correlación por request, propagado con `AsyncLocalStorage`: cualquier
 * código en la cadena (caso de uso, adaptador, futura llamada a Vertex) lo lee
 * con `CorrelationContext.get()` sin que se lo pasen por parámetro. Lo arma
 * `CorrelationIdMiddleware`; un futuro consumidor de Eventarc/Pub/Sub debe
 * envolver su handler con `run()` usando el id que venga en el mensaje para
 * que la trayectoria del activo se pueda reconstruir extremo a extremo.
 */
export const CorrelationContext = {
  run<T>(correlationId: string, callback: () => T): T {
    return storage.run({ correlationId }, callback);
  },

  get(): string | undefined {
    return storage.getStore()?.correlationId;
  },
};
