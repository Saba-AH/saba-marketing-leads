import type { MensajeChat } from '../../../domain/Chats';

export interface ResponderConversacionPort {
  execute(input: {
    conversationId: string;
    cuerpo: string;
    enviadoPor: string;
  }): Promise<MensajeChat>;
}
