import {
  conversacionesResponseSchema,
  mensajeResponseSchema,
  mensajesResponseSchema,
  sinDatosResponseSchema,
  type TConversacionResumen,
  type TEnviarMensaje,
  type TMensajeChat,
} from '@repo/schemas';
import type { Safe } from '@repo/utils';
import type { HttpClient, HttpRequestOptions } from '../http';

/** WhatsAppService — chats de WhatsApp: conversaciones, mensajes y respuestas. */
export class WhatsAppService {
  private readonly basePath = '/v1/whatsapp/conversaciones';

  constructor(private readonly httpClient: HttpClient) {}

  async listarConversaciones(
    options?: HttpRequestOptions
  ): Promise<Safe<TConversacionResumen[]>> {
    return await this.httpClient.get(
      this.basePath,
      undefined,
      options,
      conversacionesResponseSchema
    );
  }

  async listarMensajes(
    conversationId: string,
    options?: HttpRequestOptions
  ): Promise<Safe<TMensajeChat[]>> {
    return await this.httpClient.get(
      `${this.basePath}/${encodeURIComponent(conversationId)}/mensajes`,
      undefined,
      options,
      mensajesResponseSchema
    );
  }

  async enviarMensaje(
    conversationId: string,
    datos: TEnviarMensaje,
    options?: HttpRequestOptions
  ): Promise<Safe<TMensajeChat>> {
    return await this.httpClient.post(
      `${this.basePath}/${encodeURIComponent(conversationId)}/mensajes`,
      datos,
      undefined,
      options,
      mensajeResponseSchema
    );
  }

  async marcarLeida(
    conversationId: string,
    options?: HttpRequestOptions
  ): Promise<Safe<null>> {
    return await this.httpClient.post(
      `${this.basePath}/${encodeURIComponent(conversationId)}/leida`,
      undefined,
      undefined,
      options,
      sinDatosResponseSchema
    );
  }

  async indicarEscribiendo(
    conversationId: string,
    options?: HttpRequestOptions
  ): Promise<Safe<null>> {
    return await this.httpClient.post(
      `${this.basePath}/${encodeURIComponent(conversationId)}/escribiendo`,
      undefined,
      undefined,
      options,
      sinDatosResponseSchema
    );
  }
}
