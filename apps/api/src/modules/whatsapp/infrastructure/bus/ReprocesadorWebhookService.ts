import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { StructuredLogger } from '../../../../infrastructure/logging/StructuredLogger';
import type { ReprocesarPendientesPort } from '../../application/ports/in/ReprocesarPendientesPort';
import { WHATSAPP_TOKENS } from '../../tokens';

const CADA_MS = 60_000;

/**
 * Red de seguridad del handler: recoge lo que quedó sin procesar porque la API
 * se reinició, el aviso se perdió o la transacción falló. Varias instancias
 * pueden correrlo a la vez: cada evento se toma con FOR UPDATE SKIP LOCKED.
 */
@Injectable()
export class ReprocesadorWebhookService
  implements OnModuleInit, OnModuleDestroy
{
  private timer: NodeJS.Timeout | undefined;
  private corriendo = false;

  constructor(
    @Inject(WHATSAPP_TOKENS.ReprocesarPendientes)
    private readonly reprocesar: ReprocesarPendientesPort,
    private readonly logger: StructuredLogger
  ) {}

  onModuleInit(): void {
    void this.pasada();
    this.timer = setInterval(() => void this.pasada(), CADA_MS);
    // No retiene el proceso abierto (tests, apagado).
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  private async pasada(): Promise<void> {
    if (this.corriendo) return;
    this.corriendo = true;
    try {
      await this.reprocesar.execute();
    } catch (error: unknown) {
      void this.logger.error(
        'falló el barrido de eventos de webhook',
        error instanceof Error ? error.stack : String(error),
        'WhatsAppWebhook'
      );
    } finally {
      this.corriendo = false;
    }
  }
}
