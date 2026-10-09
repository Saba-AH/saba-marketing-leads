import { Inject, Injectable } from '@nestjs/common';
import { InvalidWebhookSignatureException } from '../../domain/exceptions/InvalidWebhookSignatureException';
import { extractChanges } from '../../domain/WebhookChange';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  IncomingWebhook,
  ReceiveWebhookPort,
} from '../ports/in/ReceiveWebhookPort';
import type { WebhookEventPublisherPort } from '../ports/out/WebhookEventPublisherPort';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';
import type { WebhookSignatureVerifierPort } from '../ports/out/WebhookSignatureVerifierPort';

/**
 * Only saves and signals: Meta retries if it does not get a 200 within a few
 * seconds, so processing happens separately (event + sweep) and never blocks
 * the response.
 */
@Injectable()
export class ReceiveWebhookUseCase implements ReceiveWebhookPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookSignatureVerifier)
    private readonly signatures: WebhookSignatureVerifierPort,
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly events: WebhookEventRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WebhookEventPublisher)
    private readonly publisher: WebhookEventPublisherPort
  ) {}

  async execute({
    rawBody,
    signature,
    body,
  }: IncomingWebhook): Promise<number> {
    if (!this.signatures.isValid(rawBody, signature)) {
      throw new InvalidWebhookSignatureException();
    }

    const changes = extractChanges(body);
    if (changes.length === 0) return 0;

    const ids = await this.events.save(changes);
    this.publisher.publishReceived(ids);
    return ids.length;
  }
}
