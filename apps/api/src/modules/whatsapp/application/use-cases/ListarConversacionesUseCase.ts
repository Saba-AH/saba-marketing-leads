import { Inject, Injectable } from '@nestjs/common';
import { type ConversacionResumen } from '../../domain/Chats';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ListarConversacionesPort } from '../ports/in/ListarConversacionesPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

const LIMITE_CONVERSACIONES = 200;

@Injectable()
export class ListarConversacionesUseCase implements ListarConversacionesPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(): Promise<ConversacionResumen[]> {
    return this.chats.listarConversaciones(LIMITE_CONVERSACIONES);
  }
}
