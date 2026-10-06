import { safe } from './safe-functions';

/**
 * @function safeFetch
 * @description Wraps the `fetch` function with error handling using the `safe` utility.
 *              Returns a `Safe` type object containing the JSON response or an error message.
 *
 * @param {RequestInfo | URL} input - The input to fetch, similar to the `fetch` API.
 * @param {RequestInit} [init] - Optional settings to apply to the request.
 *
 * @returns {Promise<Safe<unknown>>} - A `Safe` object containing the JSON-parsed data if successful,
 *                                     or an error message if an error occurs.
 *
 * @example
 * ```typescript
 * async function fetchData() {
 *   const response = await safeFetch('https://api.example.com/data');
 *   if (response.success) {
 *     console.log(response.data); // Process the JSON data
 *   } else {
 *     console.error(response.error); // Handle the fetch error
 *   }
 * };
 * ```
 */
// `RequestInfo` no siempre existe como global ambiental — depende de la
// combinación exacta de versiones de @types/node/undici-types resueltas por
// npm (varía entre un install completo y uno pruneado por `turbo prune`,
// como el que arma cada Dockerfile). Derivarlo de la firma real de `fetch`
// evita depender de ese nombre.
type FetchInput = Parameters<typeof fetch>[0];

export async function safeFetch(input: FetchInput | URL, init?: RequestInit) {
  const response = await safe(fetch(input, init));
  if (response.success) {
    const jsonResponse = await safe<unknown>(response.data.json());
    return jsonResponse;
  }
  return response;
}
