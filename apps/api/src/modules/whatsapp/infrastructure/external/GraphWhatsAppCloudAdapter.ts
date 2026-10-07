import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { WhatsAppCloudPort } from '../../application/ports/out/WhatsAppCloudPort';
import { type ArchivoMedia, ErrorEnvioMeta } from '../../domain/Chats';
import { WhatsAppNoConfiguradoException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { WhatsAppConfig } from '../whatsappConfig';

const TIMEOUT_MS = 15_000;

const respuestaEnvioSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1) })).min(1),
});

const mediaSchema = z.object({
  url: z.url(),
  mime_type: z.string().min(1),
  file_size: z.coerce.number().optional(),
});

const respuestaErrorSchema = z.object({
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

  async enviarTexto(to: string, cuerpo: string): Promise<string> {
    const { accessToken, phoneNumberId, graphVersion } = this.config;
    if (!accessToken || !phoneNumberId) {
      throw new WhatsAppNoConfiguradoException();
    }

    const respuesta = await fetch(
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
          text: { preview_url: false, body: cuerpo },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    const json: unknown = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      const error = respuestaErrorSchema.safeParse(json);
      throw new ErrorEnvioMeta(
        error.success ? (error.data.error.code ?? null) : null,
        error.success
          ? (error.data.error.error_data?.details ??
              error.data.error.message ??
              `HTTP ${respuesta.status}`)
          : `HTTP ${respuesta.status}`
      );
    }

    const ok = respuestaEnvioSchema.safeParse(json);
    if (!ok.success) {
      throw new ErrorEnvioMeta(null, 'Meta respondió sin el id del mensaje');
    }
    const [mensaje] = ok.data.messages;
    if (!mensaje) throw new ErrorEnvioMeta(null, 'Meta respondió sin mensajes');
    return mensaje.id;
  }

  async descargarMedia(mediaId: string): Promise<ArchivoMedia> {
    const { accessToken, graphVersion } = this.config;
    if (!accessToken) throw new WhatsAppNoConfiguradoException();
    const autorizacion = { Authorization: `Bearer ${accessToken}` };

    // Paso 1: Meta da una URL temporal (~5 min) que también exige el token.
    const info = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(mediaId)}`,
      { headers: autorizacion, signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    const json: unknown = await info.json().catch(() => null);
    if (!info.ok) throw this.errorDeMeta(json, info.status);
    const media = mediaSchema.safeParse(json);
    if (!media.success) {
      throw new ErrorEnvioMeta(null, 'Meta respondió sin la URL del archivo');
    }

    // Paso 2: el archivo. Sin timeout total: un video grande tarda en bajar.
    const archivo = await fetch(media.data.url, { headers: autorizacion });
    if (!archivo.ok || !archivo.body) {
      throw new ErrorEnvioMeta(
        null,
        `HTTP ${archivo.status} al bajar el archivo`
      );
    }
    return {
      mimeType: media.data.mime_type,
      tamano: media.data.file_size ?? null,
      contenido: archivo.body,
    };
  }

  private errorDeMeta(json: unknown, status: number): ErrorEnvioMeta {
    const error = respuestaErrorSchema.safeParse(json);
    return new ErrorEnvioMeta(
      error.success ? (error.data.error.code ?? null) : null,
      error.success
        ? (error.data.error.error_data?.details ??
            error.data.error.message ??
            `HTTP ${status}`)
        : `HTTP ${status}`
    );
  }
}
