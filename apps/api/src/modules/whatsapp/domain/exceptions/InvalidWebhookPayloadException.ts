import { DomainException } from '../../../../infrastructure/errors/DomainException';

/** Never reaches HTTP: it is saved as the event's `error` to diagnose it. */
export class InvalidWebhookPayloadException extends DomainException {
  constructor(readonly detail: string) {
    super('WHATSAPP_INVALID_WEBHOOK_PAYLOAD');
  }
}
