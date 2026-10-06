import { meResponseSchema, type TUsuarioSesion } from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/**
 * AuthService — quién tiene la sesión. El login y el logout no pasan por acá:
 * los hace el BFF del cliente, que es el único que ve los tokens.
 */
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  async me(options?: HttpRequestOptions): Promise<Safe<TUsuarioSesion>> {
    return await this.httpClient.get(
      '/v1/me',
      undefined,
      options,
      meResponseSchema
    );
  }
}
