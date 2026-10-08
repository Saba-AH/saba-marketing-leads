import { Inject, Injectable } from '@nestjs/common';
import { ConversacionNoEncontradaException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  ClienteSabaDelChat,
  ObtenerClienteSabaPort,
} from '../ports/in/ObtenerClienteSabaPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { ClientesSabaPort } from '../ports/out/ClientesSabaPort';

/**
 * Se consulta al abrir el chat (una búsqueda por chat abierto), no al listar
 * ni al recibir mensajes: Saba es la única fuente de sus clientes.
 */
@Injectable()
export class ObtenerClienteSabaUseCase implements ObtenerClienteSabaPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.ClientesSaba)
    private readonly clientesSaba: ClientesSabaPort
  ) {}

  async execute(
    conversationId: string,
    credencial: string
  ): Promise<ClienteSabaDelChat> {
    const conversacion = await this.chats.obtenerConversacion(conversationId);
    if (!conversacion) throw new ConversacionNoEncontradaException();
    const telefono = conversacion.contacto.waId;
    if (!telefono) return { sinTelefono: true, clientes: [] };
    return {
      sinTelefono: false,
      clientes: await this.clientesSaba.buscarPorTelefono(telefono, credencial),
    };
  }
}
