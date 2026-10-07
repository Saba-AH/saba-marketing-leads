import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class FirmaWebhookInvalidaException extends DomainException {
  constructor() {
    super('WHATSAPP_FIRMA_WEBHOOK_INVALIDA');
  }
}
