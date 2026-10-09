import { Inject, Injectable } from '@nestjs/common';
import { type ConversationSummary } from '../../domain/Chats';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ListConversationsPort } from '../ports/in/ListConversationsPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';

const CONVERSATIONS_LIMIT = 200;

@Injectable()
export class ListConversationsUseCase implements ListConversationsPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort
  ) {}

  async execute(): Promise<ConversationSummary[]> {
    return this.chats.listConversations(CONVERSATIONS_LIMIT);
  }
}
