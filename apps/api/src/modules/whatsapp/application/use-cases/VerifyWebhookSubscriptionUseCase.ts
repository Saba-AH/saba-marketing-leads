import { Inject, Injectable } from '@nestjs/common';
import { WebhookSubscriptionRejectedException } from '../../domain/exceptions/WebhookSubscriptionRejectedException';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  VerifyWebhookSubscriptionPort,
  WebhookSubscriptionRequest,
} from '../ports/in/VerifyWebhookSubscriptionPort';
import type { WebhookSettings } from '../ports/out/WebhookSettings';

@Injectable()
export class VerifyWebhookSubscriptionUseCase
  implements VerifyWebhookSubscriptionPort
{
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookSettings)
    private readonly settings: WebhookSettings
  ) {}

  execute({
    mode,
    verifyToken,
    challenge,
  }: WebhookSubscriptionRequest): string {
    const expected = this.settings.verifyToken;
    if (
      !expected ||
      mode !== 'subscribe' ||
      verifyToken !== expected ||
      !challenge
    ) {
      throw new WebhookSubscriptionRejectedException();
    }
    return challenge;
  }
}
