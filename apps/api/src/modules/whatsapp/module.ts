import { Module } from '@nestjs/common';
import { SabaClientesModule } from '../sabaClientes/module';
import { ProcesarWebhookEventoUseCase } from './application/use-cases/ProcesarWebhookEventoUseCase';
import { RecibirWebhookUseCase } from './application/use-cases/RecibirWebhookUseCase';
import { ReprocesarPendientesUseCase } from './application/use-cases/ReprocesarPendientesUseCase';
import { VerificarSuscripcionWebhookUseCase } from './application/use-cases/VerificarSuscripcionWebhookUseCase';
import { CqrsWebhookEventPublisher } from './infrastructure/bus/CqrsWebhookEventPublisher';
import { ProcesarWebhookEventoHandler } from './infrastructure/bus/ProcesarWebhookEventoHandler';
import { ReprocesadorWebhookService } from './infrastructure/bus/ReprocesadorWebhookService';
import { HmacWebhookSignatureVerifier } from './infrastructure/external/HmacWebhookSignatureVerifier';
import { DrizzleInboxUnitOfWork } from './infrastructure/persistence/DrizzleInboxUnitOfWork';
import { DrizzleWebhookEventRepository } from './infrastructure/persistence/DrizzleWebhookEventRepository';
import { SabaClientesCandidatosAdapter } from './infrastructure/sabaClientes/SabaClientesCandidatosAdapter';
import { WhatsAppWebhookController } from './infrastructure/web/WhatsAppWebhookController';
import { loadWhatsAppConfig } from './infrastructure/whatsappConfig';
import { WHATSAPP_TOKENS } from './tokens';

@Module({
  imports: [SabaClientesModule],
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
    {
      provide: WHATSAPP_TOKENS.InboxUnitOfWork,
      useClass: DrizzleInboxUnitOfWork,
    },
    {
      provide: WHATSAPP_TOKENS.ClienteSabaReader,
      useClass: SabaClientesCandidatosAdapter,
    },
    ProcesarWebhookEventoUseCase,
    {
      provide: WHATSAPP_TOKENS.ProcesarWebhookEvento,
      useExisting: ProcesarWebhookEventoUseCase,
    },
    ReprocesarPendientesUseCase,
    {
      provide: WHATSAPP_TOKENS.ReprocesarPendientes,
      useExisting: ReprocesarPendientesUseCase,
    },
    ProcesarWebhookEventoHandler,
    ReprocesadorWebhookService,
  ],
})
export class WhatsAppModule {}
