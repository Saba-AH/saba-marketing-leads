import type { ChatMessage } from '../../../domain/Chats';

export interface ReplyToConversationPort {
  execute(input: {
    conversationId: string;
    body: string;
    sentBy: string;
  }): Promise<ChatMessage>;
}
