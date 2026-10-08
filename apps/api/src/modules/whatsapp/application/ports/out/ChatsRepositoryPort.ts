import type { ConversacionResumen, MensajeChat } from '../../../domain/Chats';

export interface NuevoMensajeSaliente {
  conversationId: string;
  cuerpo: string;
  enviadoPor: string;
  waTimestamp: Date;
}

export interface ChatsRepositoryPort {
  listarConversaciones(limite: number): Promise<ConversacionResumen[]>;
  obtenerConversacion(id: string): Promise<ConversacionResumen | null>;
  /** Los más recientes, devueltos en orden cronológico. */
  listarMensajes(
    conversationId: string,
    limite: number
  ): Promise<MensajeChat[]>;
  /** Inserta el mensaje como `pendiente` y lo deja como último de la conversación. */
  registrarSaliente(mensaje: NuevoMensajeSaliente): Promise<MensajeChat>;
  confirmarEnvio(mensajeId: string, wamid: string): Promise<MensajeChat>;
  registrarFalloEnvio(
    mensajeId: string,
    codigo: string | null,
    detalle: string
  ): Promise<void>;
  marcarLeida(conversationId: string): Promise<boolean>;
  /** `wamid` del último mensaje que mandó el cliente; `null` si nunca escribió. */
  ultimoWamidEntrante(conversationId: string): Promise<string | null>;
  /** `undefined` si el mensaje no existe; `null` si existe pero no tiene archivo. */
  mediaIdDe(mensajeId: string): Promise<string | null | undefined>;
}
