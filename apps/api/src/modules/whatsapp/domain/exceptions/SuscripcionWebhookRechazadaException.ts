import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class SuscripcionWebhookRechazadaException extends DomainException {
  constructor() {
    super('WHATSAPP_SUSCRIPCION_WEBHOOK_RECHAZADA');
  }
}
