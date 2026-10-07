import { Inject, Injectable } from '@nestjs/common';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { WebhookEventRepositoryPort } from '../../application/ports/out/WebhookEventRepositoryPort';
import type { WebhookCambio } from '../../domain/WebhookCambio';
import { whatsappWebhookEvents } from './whatsapp.schema';

@Injectable()
export class DrizzleWebhookEventRepository
  implements WebhookEventRepositoryPort
{
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async guardar(cambios: WebhookCambio[]): Promise<string[]> {
    const filas = await this.db
      .insert(whatsappWebhookEvents)
      .values(
        cambios.map((cambio) => ({
          campo: cambio.campo,
          payload: cambio.payload,
        }))
      )
      .returning({ id: whatsappWebhookEvents.id });
    return filas.map((fila) => fila.id);
  }
}
