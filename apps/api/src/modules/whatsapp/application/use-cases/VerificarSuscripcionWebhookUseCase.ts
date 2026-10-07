import { Inject, Injectable } from '@nestjs/common';
import { SuscripcionWebhookRechazadaException } from '../../domain/exceptions/SuscripcionWebhookRechazadaException';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  SolicitudSuscripcionWebhook,
  VerificarSuscripcionWebhookPort,
} from '../ports/in/VerificarSuscripcionWebhookPort';
import type { WebhookSettings } from '../ports/out/WebhookSettings';

@Injectable()
export class VerificarSuscripcionWebhookUseCase
  implements VerificarSuscripcionWebhookPort
{
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookSettings)
    private readonly settings: WebhookSettings
  ) {}

  execute({
    mode,
    verifyToken,
    challenge,
  }: SolicitudSuscripcionWebhook): string {
    const esperado = this.settings.verifyToken;
    if (
      !esperado ||
      mode !== 'subscribe' ||
      verifyToken !== esperado ||
      !challenge
    ) {
      throw new SuscripcionWebhookRechazadaException();
    }
    return challenge;
  }
}
