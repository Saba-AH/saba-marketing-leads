import type { ChatMessage, ConversationSummary } from '../../../domain/Chats';

export interface NewOutboundMessage {
  conversationId: string;
  body: string;
  sentBy: string;
  waTimestamp: Date;
}

export interface ChatsRepositoryPort {
  listConversations(limit: number): Promise<ConversationSummary[]>;
  getConversation(id: string): Promise<ConversationSummary | null>;
  /** The most recent ones, returned in chronological order. */
  listMessages(conversationId: string, limit: number): Promise<ChatMessage[]>;
  /** Inserts the message as `pending` and makes it the conversation's last one. */
  registerOutbound(message: NewOutboundMessage): Promise<ChatMessage>;
  confirmSend(messageId: string, wamid: string): Promise<ChatMessage>;
  registerSendFailure(
    messageId: string,
    code: string | null,
    detail: string
  ): Promise<void>;
  markAsRead(conversationId: string): Promise<boolean>;
  /** `wamid` of the last message the customer sent; `null` if they never wrote. */
  lastInboundWamid(conversationId: string): Promise<string | null>;
  /** `undefined` if the message does not exist; `null` if it exists but has no file. */
  mediaIdOf(messageId: string): Promise<string | null | undefined>;
}
