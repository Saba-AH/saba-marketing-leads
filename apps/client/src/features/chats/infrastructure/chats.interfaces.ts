import type {
  TClienteSabaChat,
  TConversacionResumen,
  TEnviarMensaje,
  TMensajeChat,
} from '@repo/schemas';
import type { Safe } from '@repo/utils';

/** Puerto: lo único que esta feature necesita de la API. */
export interface ChatsApi {
  listarConversaciones(): Promise<Safe<TConversacionResumen[]>>;
  listarMensajes(conversationId: string): Promise<Safe<TMensajeChat[]>>;
  enviarMensaje(
    conversationId: string,
    datos: TEnviarMensaje
  ): Promise<Safe<TMensajeChat>>;
  marcarLeida(conversationId: string): Promise<Safe<null>>;
  indicarEscribiendo(conversationId: string): Promise<Safe<null>>;
  obtenerClienteSaba(conversationId: string): Promise<Safe<TClienteSabaChat>>;
}
