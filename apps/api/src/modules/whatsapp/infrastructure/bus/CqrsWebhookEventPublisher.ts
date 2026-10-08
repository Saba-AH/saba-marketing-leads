import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { WebhookEventPublisherPort } from '../../application/ports/out/WebhookEventPublisherPort';
import { WebhookEventReceived } from '../../domain/events/WebhookEventReceived';

@Injectable()
export class CqrsWebhookEventPublisher implements WebhookEventPublisherPort {
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: StructuredLogger
  ) {}

  publishReceived(eventIds: string[]): void {
    try {
      this.eventBus.publishAll(
        eventIds.map((id) => new WebhookEventReceived(id))
      );
    } catch (error: unknown) {
      // The event is already saved: the sweep processes it anyway.
      void this.logger.error(
        'no se pudo publicar WebhookEventoRecibido',
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    }
  }
}
