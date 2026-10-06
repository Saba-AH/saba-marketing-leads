import type { DatosLead, Lead } from '../../../domain/Lead';

export interface LeadRepositoryPort {
  findAll(): Promise<Lead[]>;
  findByCorreo(correo: string): Promise<Lead | null>;
  /** Lanza `LeadCorreoDuplicadoException` si el índice único lo rechaza. */
  crear(datos: DatosLead): Promise<Lead>;
}
