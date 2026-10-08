import { Inject } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { ProcessWebhookEventPort } from '../../application/ports/in/ProcessWebhookEventPort';
import { WebhookEventReceived } from '../../domain/events/WebhookEventReceived';
import { WHATSAPP_TOKENS } from '../../tokens';

@EventsHandler(WebhookEventReceived)
export class ProcessWebhookEventHandler
  implements IEventHandler<WebhookEventReceived>
{
  constructor(
    @Inject(WHATSAPP_TOKENS.ProcessWebhookEvent)
    private readonly process: ProcessWebhookEventPort,
    private readonly logger: StructuredLogger
  ) {}

  async handle({ eventId }: WebhookEventReceived): Promise<void> {
    try {
      const result = await this.process.execute(eventId);
      if (result === 'failed') {
        // The reason stays in whatsapp_webhook_events.error; the sweep retries.
        void this.logger.warn(
          `evento de webhook ${eventId} falló; se reintenta en el barrido`,
          'WhatsAppWebhook'
        );
      }
    } catch (error: unknown) {
      void this.logger.error(
        `no se pudo procesar el evento de webhook ${eventId}`,
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    }
  }
}
