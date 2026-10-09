import { Inject, Injectable } from '@nestjs/common';
import { type ChatMessage } from '../../domain/Chats';
import { ConversationNotFoundException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ListMessagesPort } from '../ports/in/ListMessagesPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

const MESSAGES_LIMIT = 200;

@Injectable()
export class ListMessagesUseCase implements ListMessagesPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(conversationId: string): Promise<ChatMessage[]> {
    if (!(await this.chats.getConversation(conversationId))) {
      throw new ConversationNotFoundException();
    }
    return this.chats.listMessages(conversationId, MESSAGES_LIMIT);
  }
}
