import { Inject, Injectable } from '@nestjs/common';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ProcesarWebhookEventoPort } from '../ports/in/ProcesarWebhookEventoPort';
import type { ReprocesarPendientesPort } from '../ports/in/ReprocesarPendientesPort';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';

/** Pasado este número de fallos el evento queda para revisión manual. */
export const MAX_INTENTOS = 5;
const LOTE = 100;

@Injectable()
export class ReprocesarPendientesUseCase implements ReprocesarPendientesPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly eventos: WebhookEventRepositoryPort,
    @Inject(WHATSAPP_TOKENS.ProcesarWebhookEvento)
    private readonly procesar: ProcesarWebhookEventoPort
  ) {}

  async execute(): Promise<number> {
    const ids = await this.eventos.pendientes(MAX_INTENTOS, LOTE);
    let procesados = 0;
    // Uno por uno y en orden de llegada: cada evento es su propia transacción
    // y los mensajes de un mismo chat no deben aplicarse desordenados.
    for (const id of ids) {
      if ((await this.procesar.execute(id)) === 'procesado') procesados++;
    }
    return procesados;
  }
}
