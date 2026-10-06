import {
  leadResponseSchema,
  leadsResponseSchema,
  type TCrearLead,
  type TLead,
} from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/** LeadsService — alta y listado de leads de marketing. */
export class LeadsService {
  private readonly basePath = '/v1/leads';

  constructor(private readonly httpClient: HttpClient) {}

  async listar(options?: HttpRequestOptions): Promise<Safe<TLead[]>> {
    return await this.httpClient.get(
      this.basePath,
      undefined,
      options,
      leadsResponseSchema
    );
  }

  async crear(
    datos: TCrearLead,
    options?: HttpRequestOptions
  ): Promise<Safe<TLead>> {
    return await this.httpClient.post(
      this.basePath,
      datos,
      undefined,
      options,
      leadResponseSchema
    );
  }
}
