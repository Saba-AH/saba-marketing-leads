import type { ChatMessage } from '../../../domain/Chats';

export interface ListMessagesPort {
  execute(conversationId: string): Promise<ChatMessage[]>;
}
