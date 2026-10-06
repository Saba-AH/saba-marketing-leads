import type { TCrearLead, TLead } from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Puerto: lo único que esta feature necesita de la API. */
export interface LeadsApi {
  listar(): Promise<Safe<TLead[]>>;
  crear(datos: TCrearLead): Promise<Safe<TLead>>;
}
