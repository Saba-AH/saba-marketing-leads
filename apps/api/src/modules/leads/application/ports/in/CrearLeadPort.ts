import type { DatosLead, Lead } from '../../../domain/Lead';

export interface CrearLeadPort {
  execute(datos: DatosLead): Promise<Lead>;
}
