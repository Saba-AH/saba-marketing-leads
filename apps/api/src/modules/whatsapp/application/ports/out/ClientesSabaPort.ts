import type { ClienteSaba } from '../../../../sabaClientes/domain/ClienteSaba';

/** Lo que el chat necesita de Saba; lo cumple el lector que exporta `sabaClientes`. */
export interface ClientesSabaPort {
  buscarPorTelefono(
    telefono: string,
    credencial: string
  ): Promise<ClienteSaba[]>;
}
