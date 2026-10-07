import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { WebhookSignatureVerifierPort } from '../../application/ports/out/WebhookSignatureVerifierPort';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { WhatsAppConfig } from '../whatsappConfig';

const PREFIJO = 'sha256=';

/** `X-Hub-Signature-256: sha256=<HMAC-SHA256 del cuerpo crudo con el app secret>`. */
@Injectable()
export class HmacWebhookSignatureVerifier
  implements WebhookSignatureVerifierPort
{
  constructor(
    @Inject(WHATSAPP_TOKENS.Config) private readonly config: WhatsAppConfig
  ) {}

  esValida(rawBody: Buffer | undefined, firma: string | undefined): boolean {
    const secreto = this.config.appSecret;
    if (!secreto || !rawBody || !firma?.startsWith(PREFIJO)) return false;

    const recibida = Buffer.from(firma.slice(PREFIJO.length), 'hex');
    const esperada = createHmac('sha256', secreto).update(rawBody).digest();
    // timingSafeEqual lanza si los largos difieren.
    return (
      recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
    );
  }
}
