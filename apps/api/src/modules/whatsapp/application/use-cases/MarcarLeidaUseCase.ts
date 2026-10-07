import { Inject, Injectable } from '@nestjs/common';
import { ConversacionNoEncontradaException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { MarcarLeidaPort } from '../ports/in/MarcarLeidaPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

@Injectable()
export class MarcarLeidaUseCase implements MarcarLeidaPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(conversationId: string): Promise<void> {
    if (!(await this.chats.marcarLeida(conversationId))) {
      throw new ConversacionNoEncontradaException();
    }
  }
}
