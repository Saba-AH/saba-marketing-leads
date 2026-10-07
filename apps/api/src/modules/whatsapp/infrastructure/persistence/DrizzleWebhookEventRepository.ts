import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
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

  async registrarFallo(eventoId: string, error: string): Promise<void> {
    await this.db
      .update(whatsappWebhookEvents)
      .set({
        intentos: sql`${whatsappWebhookEvents.intentos} + 1`,
        error: error.slice(0, 2000),
      })
      .where(eq(whatsappWebhookEvents.id, eventoId));
  }

  async pendientes(maxIntentos: number, limite: number): Promise<string[]> {
    const filas = await this.db
      .select({ id: whatsappWebhookEvents.id })
      .from(whatsappWebhookEvents)
      .where(
        and(
          isNull(whatsappWebhookEvents.procesadoAt),
          lt(whatsappWebhookEvents.intentos, maxIntentos)
        )
      )
      .orderBy(asc(whatsappWebhookEvents.recibidoAt))
      .limit(limite);
    return filas.map((fila) => fila.id);
  }
}
