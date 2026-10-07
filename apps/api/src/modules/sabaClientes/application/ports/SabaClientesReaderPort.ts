import type { ClienteSaba, ResumenClienteSaba } from '../../domain/ClienteSaba';

/** Fachada de solo lectura sobre `profiles` y `applications` de Saba. */
export interface SabaClientesReaderPort {
  /** Perfiles cuyo teléfono coincide con el `wa_id`, el mejor candidato primero. */
  buscarPorTelefono(waId: string): Promise<ClienteSaba[]>;
  obtenerResumen(profileId: string): Promise<ResumenClienteSaba | null>;
  /** Por nombre, apellido, cédula o teléfono; hasta 20 resultados. */
  buscar(texto: string): Promise<ClienteSaba[]>;
}
