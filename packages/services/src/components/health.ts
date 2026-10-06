import { healthResponseSchema, type THealth } from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/**
 * HealthService — estado de la API.
 *
 * No lleva token: es el único endpoint que el cliente consulta antes de autenticarse.
 */
export class HealthService {
  private readonly basePath = '/v1/health';

  constructor(private readonly httpClient: HttpClient) {}

  async check(options?: HttpRequestOptions): Promise<Safe<THealth>> {
    return await this.httpClient.get(
      this.basePath,
      undefined,
      { authorization: false, ...options },
      healthResponseSchema
    );
  }
}
