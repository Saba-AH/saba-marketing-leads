import {
  leadResponseSchema,
  leadsResponseSchema,
  type TCreateLead,
  type TLead,
} from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/** LeadsService — creating and listing marketing leads. */
export class LeadsService {
  private readonly basePath = '/v1/leads';

  constructor(private readonly httpClient: HttpClient) {}

  async list(options?: HttpRequestOptions): Promise<Safe<TLead[]>> {
    return await this.httpClient.get(
      this.basePath,
      undefined,
      options,
      leadsResponseSchema
    );
  }

  async create(
    data: TCreateLead,
    options?: HttpRequestOptions
  ): Promise<Safe<TLead>> {
    return await this.httpClient.post(
      this.basePath,
      data,
      undefined,
      options,
      leadResponseSchema
    );
  }
}
