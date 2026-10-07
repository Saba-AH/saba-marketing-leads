import { DomainException } from '../../../../infrastructure/errors/DomainException';

/** No llega a HTTP: se guarda como `error` del evento para diagnosticarlo. */
export class PayloadWebhookInvalidoException extends DomainException {
  constructor(readonly detalle: string) {
    super('WHATSAPP_PAYLOAD_WEBHOOK_INVALIDO');
  }
}
