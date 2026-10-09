import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { WhatsAppCloudPort } from '../../application/ports/out/WhatsAppCloudPort';
import { type MediaFile, MetaSendError } from '../../domain/Chats';
import { WhatsAppNotConfiguredException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { WhatsAppConfig } from '../whatsappConfig';

const TIMEOUT_MS = 15_000;

const sendResponseSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1) })).min(1),
});

const mediaSchema = z.object({
  url: z.url(),
  mime_type: z.string().min(1),
  file_size: z.coerce.number().optional(),
});

const errorResponseSchema = z.object({
  error: z.looseObject({
    code: z.number().optional(),
    message: z.string().optional(),
    error_data: z.looseObject({ details: z.string().optional() }).optional(),
  }),
});

@Injectable()
export class GraphWhatsAppCloudAdapter implements WhatsAppCloudPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.Config) private readonly config: WhatsAppConfig
  ) {}

  async sendText(to: string, body: string): Promise<string> {
    const { accessToken, phoneNumberId, graphVersion } = this.config;
    if (!accessToken || !phoneNumberId) {
      throw new WhatsAppNotConfiguredException();
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: body },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error = errorResponseSchema.safeParse(json);
      throw new MetaSendError(
        error.success ? (error.data.error.code ?? null) : null,
        error.success
          ? (error.data.error.error_data?.details ??
              error.data.error.message ??
              `HTTP ${response.status}`)
          : `HTTP ${response.status}`
      );
    }

    const ok = sendResponseSchema.safeParse(json);
    if (!ok.success) {
      throw new MetaSendError(null, 'Meta respondió sin el id del mensaje');
    }
    const [message] = ok.data.messages;
    if (!message) throw new MetaSendError(null, 'Meta respondió sin mensajes');
    return message.id;
  }

  async downloadMedia(mediaId: string): Promise<MediaFile> {
    const { accessToken, graphVersion } = this.config;
    if (!accessToken) throw new WhatsAppNotConfiguredException();
    const authorization = { Authorization: `Bearer ${accessToken}` };

    // Step 1: Meta gives a temporary URL (~5 min) that also requires the token.
    const info = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(mediaId)}`,
      { headers: authorization, signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    const json: unknown = await info.json().catch(() => null);
    if (!info.ok) throw this.metaError(json, info.status);
    const media = mediaSchema.safeParse(json);
    if (!media.success) {
      throw new MetaSendError(null, 'Meta respondió sin la URL del archivo');
    }

    // Step 2: the file. No overall timeout: a large video takes a while to download.
    const file = await fetch(media.data.url, { headers: authorization });
    if (!file.ok || !file.body) {
      throw new MetaSendError(null, `HTTP ${file.status} al bajar el archivo`);
    }
    return {
      mimeType: media.data.mime_type,
      size: media.data.file_size ?? null,
      content: file.body,
    };
  }

  async sendTypingIndicator(inboundWamid: string): Promise<void> {
    const { accessToken, phoneNumberId, graphVersion } = this.config;
    if (!accessToken || !phoneNumberId) {
      throw new WhatsAppNotConfiguredException();
    }
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: inboundWamid,
          typing_indicator: { type: 'text' },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!response.ok) {
      throw this.metaError(
        await response.json().catch(() => null),
        response.status
      );
    }
  }

  private metaError(json: unknown, status: number): MetaSendError {
    const error = errorResponseSchema.safeParse(json);
    return new MetaSendError(
      error.success ? (error.data.error.code ?? null) : null,
      error.success
        ? (error.data.error.error_data?.details ??
            error.data.error.message ??
            `HTTP ${status}`)
        : `HTTP ${status}`
    );
  }
}
