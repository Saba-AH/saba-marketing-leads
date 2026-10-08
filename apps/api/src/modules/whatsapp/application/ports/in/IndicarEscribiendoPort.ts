export interface IndicarEscribiendoPort {
  execute(conversationId: string): Promise<void>;
}
