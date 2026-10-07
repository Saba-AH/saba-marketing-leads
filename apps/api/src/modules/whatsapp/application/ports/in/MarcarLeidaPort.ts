export interface MarcarLeidaPort {
  execute(conversationId: string): Promise<void>;
}
