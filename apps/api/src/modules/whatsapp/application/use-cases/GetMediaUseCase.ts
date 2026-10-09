import { Inject, Injectable } from '@nestjs/common';
import { type MediaFile, MetaSendError } from '../../domain/Chats';
import { MediaUnavailableException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { GetMediaPort } from '../ports/in/GetMediaPort';
import type { ChatsRepositoryPort } from '../ports/out/ChatsRepositoryPort';
import type { WhatsAppCloudPort } from '../ports/out/WhatsAppCloudPort';

/**
 * On demand and without our own copy: the file lives in Meta (~30 days) and
 * the API only passes it through, so we do not hold customer documents (ID
 * cards, receipts).
 */
@Injectable()
export class GetMediaUseCase implements GetMediaPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.ChatsRepository)
    private readonly chats: ChatsRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WhatsAppCloud)
    private readonly cloud: WhatsAppCloudPort
  ) {}

  async execute(messageId: string): Promise<MediaFile> {
    const mediaId = await this.chats.mediaIdOf(messageId);
    if (!mediaId) throw new MediaUnavailableException();
    try {
      return await this.cloud.downloadMedia(mediaId);
    } catch (error: unknown) {
      if (error instanceof MetaSendError) {
        throw new MediaUnavailableException(error);
      }
      throw error;
    }
  }
}
