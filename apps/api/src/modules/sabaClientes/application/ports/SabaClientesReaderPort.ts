import type { ClienteSaba } from '../../domain/ClienteSaba';

/** Fachada sobre el servidor de Saba: este repo ya no lee las tablas de Saba. */
export interface SabaClientesReaderPort {
  /**
   * Perfiles de Saba con ese teléfono, el más probable primero (máx. 5).
   * `credencial` es el token de sesión del agente: Saba valida quién pregunta.
   */
  buscarPorTelefono(
    telefono: string,
    credencial: string
  ): Promise<ClienteSaba[]>;
}
