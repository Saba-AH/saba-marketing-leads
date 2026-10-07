import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { WhatsAppCloudPort } from '../../application/ports/out/WhatsAppCloudPort';
import { ErrorEnvioMeta } from '../../domain/Chats';
import { WhatsAppNoConfiguradoException } from '../../domain/exceptions/whatsappExceptions';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { WhatsAppConfig } from '../whatsappConfig';

const TIMEOUT_MS = 15_000;

const respuestaEnvioSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1) })).min(1),
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
}
