import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { WebhookEventRepositoryPort } from '../../application/ports/out/WebhookEventRepositoryPort';
import type { WebhookChange } from '../../domain/WebhookChange';
import { whatsappWebhookEvents } from './whatsapp.schema';

@Injectable()
export class DrizzleWebhookEventRepository
  implements WebhookEventRepositoryPort
{
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async save(changes: WebhookChange[]): Promise<string[]> {
    const rows = await this.db
      .insert(whatsappWebhookEvents)
      .values(
        changes.map((change) => ({
          field: change.field,
          payload: change.payload,
        }))
      )
      .returning({ id: whatsappWebhookEvents.id });
    return rows.map((row) => row.id);
  }

  async registerFailure(eventId: string, error: string): Promise<void> {
    await this.db
      .update(whatsappWebhookEvents)
      .set({
        attempts: sql`${whatsappWebhookEvents.attempts} + 1`,
        error: error.slice(0, 2000),
      })
      .where(eq(whatsappWebhookEvents.id, eventId));
  }

  async pending(maxAttempts: number, limit: number): Promise<string[]> {
    const rows = await this.db
      .select({ id: whatsappWebhookEvents.id })
      .from(whatsappWebhookEvents)
      .where(
        and(
          isNull(whatsappWebhookEvents.processedAt),
          lt(whatsappWebhookEvents.attempts, maxAttempts)
        )
      )
      .orderBy(asc(whatsappWebhookEvents.receivedAt))
      .limit(limit);
    return rows.map((row) => row.id);
  }
}
