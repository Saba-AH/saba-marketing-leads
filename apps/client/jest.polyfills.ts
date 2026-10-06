/**
 * jsdom no trae las APIs web que MSW y el cliente HTTP necesitan. Las tomamos
 * de Node y de undici.
 *
 * Tres detalles que rompen si se ignoran:
 *   - El orden: undici toca `MessagePort` al cargarse, así que los globales de
 *     Node van **antes** del `require('undici')`.
 *   - `configurable: true`: MSW redefine `Request`/`Response` al interceptar. Si
 *     los dejamos no configurables, `server.listen()` falla.
 *   - Nada de handles de Node que mantengan vivo el event loop: dejarían a Jest
 *     colgado al terminar la suite (ver `MessageChannel` y `BroadcastChannel`).
 */

// @ts-ignore
const { TextDecoder, TextEncoder } = require('node:util');
// @ts-ignore
const { clearImmediate } = require('node:timers');
const {
  ReadableStream,
  TransformStream,
  WritableStream,
} = require('node:stream/web');
const { PerformanceObserver, performance } = require('node:perf_hooks');
const { Blob, File } = require('node:buffer');
// Solo `MessagePort`, que es lo que undici toca al cargarse. Exponer también
// `MessageChannel` haría que el scheduler de React lo prefiera sobre
// setTimeout, y su handle de Node deja a Jest colgado.
const { MessagePort } = require('node:worker_threads');

/**
 * MSW exige que el global exista para su soporte de WebSockets, que aquí no se
 * usa. El `BroadcastChannel` real de Node se instancia al importar ese módulo y
 * mantiene vivo el event loop, así que va un stub inerte.
 */
class InertBroadcastChannel {
  onmessage: ((event: unknown) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;

  constructor(public readonly name: string) {}

  postMessage(): void {
    /* inerte a propósito */
  }
  close(): void {
    /* inerte a propósito */
  }
  addEventListener(): void {
    /* inerte a propósito */
  }
  removeEventListener(): void {
    /* inerte a propósito */
  }
  dispatchEvent(): boolean {
    return true;
  }
}

function define(globals: Record<string, unknown>): void {
  Object.defineProperties(
    globalThis,
    Object.fromEntries(
      Object.entries(globals).map(([name, value]) => [
        name,
        { value, writable: true, configurable: true },
      ])
    )
  );
}

define({
  TextDecoder,
  TextEncoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  clearImmediate,
  performance,
  PerformanceObserver,
  Blob,
  File,
  MessagePort,
  BroadcastChannel: InertBroadcastChannel,
});

const { fetch, Headers, FormData, Request, Response } = require('undici');

define({ fetch, Headers, FormData, Request, Response });
