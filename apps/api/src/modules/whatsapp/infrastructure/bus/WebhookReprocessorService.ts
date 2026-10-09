import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { ReprocessPendingPort } from '../../application/ports/in/ReprocessPendingPort';
import { WHATSAPP_TOKENS } from '../../tokens';

const EVERY_MS = 60_000;

/**
 * Safety net for the handler: picks up whatever was left unprocessed because
 * the API restarted, the signal was lost or the transaction failed. Several
 * instances can run it at once: each event is claimed with FOR UPDATE SKIP
 * LOCKED.
 */
@Injectable()
export class WebhookReprocessorService
  implements OnModuleInit, OnModuleDestroy
{
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    @Inject(WHATSAPP_TOKENS.ReprocessPending)
    private readonly reprocess: ReprocessPendingPort,
    private readonly logger: StructuredLogger
  ) {}

  onModuleInit(): void {
    void this.pass();
    this.timer = setInterval(() => void this.pass(), EVERY_MS);
    // Does not keep the process alive (tests, shutdown).
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  private async pass(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.reprocess.execute();
    } catch (error: unknown) {
      void this.logger.error(
        'falló el barrido de eventos de webhook',
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    } finally {
      this.running = false;
    }
  }
}
