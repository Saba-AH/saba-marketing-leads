import type { ClienteSaba } from '../../../../sabaClientes/domain/ClienteSaba';

export interface ClienteSabaDelChat {
  sinTelefono: boolean;
  clientes: ClienteSaba[];
}

export interface ObtenerClienteSabaPort {
  /** `credencial`: token de sesión del agente, que Saba vuelve a validar. */
  execute(
    conversationId: string,
    credencial: string
  ): Promise<ClienteSabaDelChat>;
}
