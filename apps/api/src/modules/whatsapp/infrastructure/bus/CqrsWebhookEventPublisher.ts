import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { WebhookEventPublisherPort } from '../../application/ports/out/WebhookEventPublisherPort';
import { WebhookEventoRecibido } from '../../domain/events/WebhookEventoRecibido';

@Injectable()
export class CqrsWebhookEventPublisher implements WebhookEventPublisherPort {
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: StructuredLogger
  ) {}

  publicarRecibidos(eventoIds: string[]): void {
    try {
      this.eventBus.publishAll(
        eventoIds.map((id) => new WebhookEventoRecibido(id))
      );
    } catch (error: unknown) {
      // El evento ya está guardado: el barrido lo procesa igual.
      void this.logger.error(
        'no se pudo publicar WebhookEventoRecibido',
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    }
  }
}
