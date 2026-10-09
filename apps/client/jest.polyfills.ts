/**
 * jsdom does not ship the web APIs MSW and the HTTP client need. We take them
 * from Node and from undici.
 *
 * Three details that break if ignored:
 *   - Order: undici touches `MessagePort` when loading, so Node's globals go
 *     **before** `require('undici')`.
 *   - `configurable: true`: MSW redefines `Request`/`Response` when
 *     intercepting. If we leave them non-configurable, `server.listen()` fails.
 *   - No Node handles that keep the event loop alive: they would leave Jest
 *     hanging at the end of the suite (see `MessageChannel` and
 *     `BroadcastChannel`).
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
// Only `MessagePort`, which is what undici touches when loading. Also exposing
// `MessageChannel` would make React's scheduler prefer it over setTimeout, and
// its Node handle leaves Jest hanging.
const { MessagePort } = require('node:worker_threads');

/**
 * MSW requires the global to exist for its WebSocket support, which is not
 * used here. Node's real `BroadcastChannel` is instantiated when that module is
 * imported and keeps the event loop alive, so an inert stub goes in.
 */
class InertBroadcastChannel {
  onmessage: ((event: unknown) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;

  constructor(public readonly name: string) {}

  postMessage(): void {
    /* inert on purpose */
  }
  close(): void {
    /* inert on purpose */
  }
  addEventListener(): void {
    /* inert on purpose */
  }
  removeEventListener(): void {
    /* inert on purpose */
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
