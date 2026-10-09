export interface SendTypingIndicatorPort {
  execute(conversationId: string): Promise<void>;
}
