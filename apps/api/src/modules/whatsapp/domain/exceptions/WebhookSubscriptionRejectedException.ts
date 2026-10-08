import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class WebhookSubscriptionRejectedException extends DomainException {
  constructor() {
    super('WHATSAPP_WEBHOOK_SUBSCRIPTION_REJECTED');
  }
}
