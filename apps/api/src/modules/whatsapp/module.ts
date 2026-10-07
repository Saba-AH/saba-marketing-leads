import { Module } from '@nestjs/common';
import { RecibirWebhookUseCase } from './application/use-cases/RecibirWebhookUseCase';
import { VerificarSuscripcionWebhookUseCase } from './application/use-cases/VerificarSuscripcionWebhookUseCase';
import { CqrsWebhookEventPublisher } from './infrastructure/bus/CqrsWebhookEventPublisher';
import { HmacWebhookSignatureVerifier } from './infrastructure/external/HmacWebhookSignatureVerifier';
import { DrizzleWebhookEventRepository } from './infrastructure/persistence/DrizzleWebhookEventRepository';
import { WhatsAppWebhookController } from './infrastructure/web/WhatsAppWebhookController';
import { loadWhatsAppConfig } from './infrastructure/whatsappConfig';
import { WHATSAPP_TOKENS } from './tokens';

@Module({
  controllers: [WhatsAppWebhookController],
  providers: [
    { provide: WHATSAPP_TOKENS.Config, useFactory: () => loadWhatsAppConfig() },
    {
      provide: WHATSAPP_TOKENS.WebhookSettings,
      useExisting: WHATSAPP_TOKENS.Config,
    },
    {
      provide: WHATSAPP_TOKENS.WebhookSignatureVerifier,
      useClass: HmacWebhookSignatureVerifier,
    },
    {
      provide: WHATSAPP_TOKENS.WebhookEventRepository,
      useClass: DrizzleWebhookEventRepository,
    },
    {
      provide: WHATSAPP_TOKENS.WebhookEventPublisher,
      useClass: CqrsWebhookEventPublisher,
    },
    VerificarSuscripcionWebhookUseCase,
    {
      provide: WHATSAPP_TOKENS.VerificarSuscripcionWebhook,
      useExisting: VerificarSuscripcionWebhookUseCase,
    },
    RecibirWebhookUseCase,
    {
      provide: WHATSAPP_TOKENS.RecibirWebhook,
      useExisting: RecibirWebhookUseCase,
    },
  ],
})
export class WhatsAppModule {}
