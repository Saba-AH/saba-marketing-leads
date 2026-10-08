import type { TCreateLead, TLead } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Port: the only thing this feature needs from the API. */
export interface LeadsApi {
  list(): Promise<Safe<TLead[]>>;
  create(data: TCreateLead): Promise<Safe<TLead>>;
}
