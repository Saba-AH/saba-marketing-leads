import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { MarkAsReadPort } from '../ports/in/MarkAsReadPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

@Injectable()
export class MarkAsReadUseCase implements MarkAsReadPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(conversationId: string): Promise<void> {
    if (!(await this.chats.markAsRead(conversationId))) {
      throw new ConversationNotFoundException();
    }
  }
}
