import { meResponseSchema, type TSessionUser } from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/**
 * AuthService — who holds the session. Login and logout do not go through
 * here: the client's BFF handles them, as it is the only one that sees the
 * tokens.
 */
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  async me(options?: HttpRequestOptions): Promise<Safe<TSessionUser>> {
    return await this.httpClient.get(
      '/v1/me',
      undefined,
      options,
      meResponseSchema
    );
  }
}
