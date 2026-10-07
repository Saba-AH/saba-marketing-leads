import type { MensajeChat } from '../../../domain/Chats';

export interface ListarMensajesPort {
  execute(conversationId: string): Promise<MensajeChat[]>;
}
