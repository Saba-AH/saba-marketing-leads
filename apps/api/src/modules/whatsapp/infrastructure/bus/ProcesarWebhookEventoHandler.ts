import { Inject } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { ProcesarWebhookEventoPort } from '../../application/ports/in/ProcesarWebhookEventoPort';
import { WebhookEventoRecibido } from '../../domain/events/WebhookEventoRecibido';
import { WHATSAPP_TOKENS } from '../../tokens';

@EventsHandler(WebhookEventoRecibido)
export class ProcesarWebhookEventoHandler
  implements IEventHandler<WebhookEventoRecibido>
{
  constructor(
    @Inject(WHATSAPP_TOKENS.ProcesarWebhookEvento)
    private readonly procesar: ProcesarWebhookEventoPort,
    private readonly logger: StructuredLogger
  ) {}

  async handle({ eventoId }: WebhookEventoRecibido): Promise<void> {
    try {
      const resultado = await this.procesar.execute(eventoId);
      if (resultado === 'fallido') {
        // El motivo queda en whatsapp_webhook_events.error; el barrido reintenta.
        void this.logger.warn(
          `evento de webhook ${eventoId} falló; se reintenta en el barrido`,
          'WhatsAppWebhook'
        );
      }
    } catch (error: unknown) {
      void this.logger.error(
        `no se pudo procesar el evento de webhook ${eventoId}`,
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    }
  }
}
