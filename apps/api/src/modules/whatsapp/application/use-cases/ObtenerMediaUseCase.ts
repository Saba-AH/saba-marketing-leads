import { Inject, Injectable } from '@nestjs/common';
import { type ArchivoMedia, ErrorEnvioMeta } from '../../domain/Chats';
import { MediaNoDisponibleException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ObtenerMediaPort } from '../ports/in/ObtenerMediaPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { WhatsAppCloudPort } from '../ports/out/WhatsAppCloudPort';

/**
 * Bajo demanda y sin copia propia: el archivo vive en Meta (~30 días) y la API
 * solo lo pasa, para no custodiar documentos de clientes (cédulas, recibos).
 */
@Injectable()
export class ObtenerMediaUseCase implements ObtenerMediaPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WhatsAppCloud)
    private readonly cloud: WhatsAppCloudPort
  ) {}

  async execute(mensajeId: string): Promise<ArchivoMedia> {
    const mediaId = await this.chats.mediaIdDe(mensajeId);
    if (!mediaId) throw new MediaNoDisponibleException();
    try {
      return await this.cloud.descargarMedia(mediaId);
    } catch (error: unknown) {
      if (error instanceof ErrorEnvioMeta) {
        throw new MediaNoDisponibleException(error);
      }
      throw error;
    }
  }
}
