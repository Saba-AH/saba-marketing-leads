import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { WebhookSignatureVerifierPort } from '../../application/ports/out/WebhookSignatureVerifierPort';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { WhatsAppConfig } from '../whatsappConfig';

const PREFIX = 'sha256=';

/** `X-Hub-Signature-256: sha256=<HMAC-SHA256 of the raw body with the app secret>`. */
@Injectable()
export class HmacWebhookSignatureVerifier
  implements WebhookSignatureVerifierPort
{
  constructor(
    @Inject(WHATSAPP_TOKENS.Config) private readonly config: WhatsAppConfig
  ) {}

  isValid(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    const secret = this.config.appSecret;
    if (!secret || !rawBody || !signature?.startsWith(PREFIX)) return false;

    const received = Buffer.from(signature.slice(PREFIX.length), 'hex');
    const expected = createHmac('sha256', secret).update(rawBody).digest();
    // timingSafeEqual throws if the lengths differ.
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }
}
