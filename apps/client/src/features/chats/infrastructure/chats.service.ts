import type { TEnviarMensaje } from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { Conversacion, Mensaje } from '../domain/chat.model';
import type { ChatsApi } from './chats.interfaces';
import { toConversacionDomain, toMensajeDomain } from './chats.transform';

function datos<T>(result: Safe<T>): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export class ChatsServiceClass {
  constructor(private chatsApi: ChatsApi) {}

  async listarConversaciones(): Promise<Conversacion[]> {
    return datos(await this.chatsApi.listarConversaciones()).map(
      toConversacionDomain
    );
  }

  async listarMensajes(conversationId: string): Promise<Mensaje[]> {
    return datos(await this.chatsApi.listarMensajes(conversationId)).map(
      toMensajeDomain
    );
  }

  async enviarMensaje(
    conversationId: string,
    mensaje: TEnviarMensaje
  ): Promise<Mensaje> {
    return toMensajeDomain(
      datos(await this.chatsApi.enviarMensaje(conversationId, mensaje))
    );
  }

  async marcarLeida(conversationId: string): Promise<void> {
    datos(await this.chatsApi.marcarLeida(conversationId));
  }
}
