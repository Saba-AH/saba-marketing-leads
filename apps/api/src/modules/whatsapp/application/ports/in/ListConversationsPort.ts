import type { ConversationSummary } from '../../../domain/Chats';

export interface ListConversationsPort {
  execute(): Promise<ConversationSummary[]>;
}
