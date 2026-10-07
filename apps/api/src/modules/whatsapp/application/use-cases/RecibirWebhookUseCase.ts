import { Inject, Injectable } from '@nestjs/common';
import { FirmaWebhookInvalidaException } from '../../domain/exceptions/FirmaWebhookInvalidaException';
import { extraerCambios } from '../../domain/WebhookCambio';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  RecibirWebhookPort,
  WebhookEntrante,
} from '../ports/in/RecibirWebhookPort';
import type { WebhookEventPublisherPort } from '../ports/out/WebhookEventPublisherPort';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';
import type { WebhookSignatureVerifierPort } from '../ports/out/WebhookSignatureVerifierPort';

/**
 * Solo guarda y avisa: Meta reintenta si no recibe 200 en pocos segundos, así
 * que el procesamiento va aparte (evento + barrido) y nunca bloquea la respuesta.
 */
@Injectable()
export class RecibirWebhookUseCase implements RecibirWebhookPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookSignatureVerifier)
    private readonly firmas: WebhookSignatureVerifierPort,
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly eventos: WebhookEventRepositoryPort,
    @Inject(WHATSAPP_TOKENS.WebhookEventPublisher)
    private readonly publicador: WebhookEventPublisherPort
  ) {}

  async execute({ rawBody, firma, cuerpo }: WebhookEntrante): Promise<number> {
    if (!this.firmas.esValida(rawBody, firma)) {
      throw new FirmaWebhookInvalidaException();
    }

    const cambios = extraerCambios(cuerpo);
    if (cambios.length === 0) return 0;

    const ids = await this.eventos.guardar(cambios);
    this.publicador.publicarRecibidos(ids);
    return ids.length;
  }
}
