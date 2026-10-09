import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class InvalidWebhookSignatureException extends DomainException {
  constructor() {
    super('WHATSAPP_INVALID_WEBHOOK_SIGNATURE');
  }
}
