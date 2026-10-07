import { Inject, Injectable } from '@nestjs/common';
import { type MensajeChat } from '../../domain/Chats';
import { ConversacionNoEncontradaException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ListarMensajesPort } from '../ports/in/ListarMensajesPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

const LIMITE_MENSAJES = 200;

@Injectable()
export class ListarMensajesUseCase implements ListarMensajesPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(conversationId: string): Promise<MensajeChat[]> {
    if (!(await this.chats.obtenerConversacion(conversationId))) {
      throw new ConversacionNoEncontradaException();
    }
    return this.chats.listarMensajes(conversationId, LIMITE_MENSAJES);
  }
}
