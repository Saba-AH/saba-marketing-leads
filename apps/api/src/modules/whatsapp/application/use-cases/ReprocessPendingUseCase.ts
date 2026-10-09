import { Inject, Injectable } from '@nestjs/common';
import { WHATSAPP_TOKENS } from '../../tokens';
import type { ProcessWebhookEventPort } from '../ports/in/ProcessWebhookEventPort';
import type { ReprocessPendingPort } from '../ports/in/ReprocessPendingPort';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';

/** Past this number of failures the event is left for manual review. */
export const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 100;

@Injectable()
export class ReprocessPendingUseCase implements ReprocessPendingPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly events: WebhookEventRepositoryPort,
    @Inject(WHATSAPP_TOKENS.ProcessWebhookEvent)
    private readonly process: ProcessWebhookEventPort
  ) {}

  async execute(): Promise<number> {
    const ids = await this.events.pending(MAX_ATTEMPTS, BATCH_SIZE);
    let processed = 0;
    // One by one and in arrival order: each event is its own transaction and the
    // messages of the same chat must not be applied out of order.
    let firstError: unknown;
    for (const id of ids) {
      try {
        if ((await this.process.execute(id)) === 'processed') processed++;
      } catch (error: unknown) {
        // An error in one event does not stop the rest of the batch.
        firstError ??= error;
      }
    }
    if (firstError !== undefined) throw firstError;
    return processed;
  }
}
