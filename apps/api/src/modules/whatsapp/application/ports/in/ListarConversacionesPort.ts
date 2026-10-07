import type { ConversacionResumen } from '../../../domain/Chats';

export interface ListarConversacionesPort {
  execute(): Promise<ConversacionResumen[]>;
}
