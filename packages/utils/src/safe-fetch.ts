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
// `RequestInfo` does not always exist as an ambient global — it depends on the
// exact combination of @types/node/undici-types versions npm resolves (it
// varies between a full install and one pruned by `turbo prune`, like the one
// each Dockerfile builds). Deriving it from `fetch`'s real signature avoids
// depending on that name.
type FetchInput = Parameters<typeof fetch>[0];

export async function safeFetch(input: FetchInput | URL, init?: RequestInit) {
  const response = await safe(fetch(input, init));
  if (response.success) {
    const jsonResponse = await safe<unknown>(response.data.json());
    return jsonResponse;
  }
  return response;
}
