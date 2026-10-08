export interface MarkAsReadPort {
  execute(conversationId: string): Promise<void>;
}
