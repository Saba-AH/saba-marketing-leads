import { Module } from '@nestjs/common';
import { SabaClientesModule } from '../sabaClientes/module';
import { ListarConversacionesUseCase } from './application/use-cases/ListarConversacionesUseCase';
import { ListarMensajesUseCase } from './application/use-cases/ListarMensajesUseCase';
import { MarcarLeidaUseCase } from './application/use-cases/MarcarLeidaUseCase';
import { ObtenerMediaUseCase } from './application/use-cases/ObtenerMediaUseCase';
import { ProcesarWebhookEventoUseCase } from './application/use-cases/ProcesarWebhookEventoUseCase';
import { RecibirWebhookUseCase } from './application/use-cases/RecibirWebhookUseCase';
import { ReprocesarPendientesUseCase } from './application/use-cases/ReprocesarPendientesUseCase';
import { ResponderConversacionUseCase } from './application/use-cases/ResponderConversacionUseCase';
import { VerificarSuscripcionWebhookUseCase } from './application/use-cases/VerificarSuscripcionWebhookUseCase';
import { CqrsWebhookEventPublisher } from './infrastructure/bus/CqrsWebhookEventPublisher';
import { ProcesarWebhookEventoHandler } from './infrastructure/bus/ProcesarWebhookEventoHandler';
import { ReprocesadorWebhookService } from './infrastructure/bus/ReprocesadorWebhookService';
import { GraphWhatsAppCloudAdapter } from './infrastructure/external/GraphWhatsAppCloudAdapter';
import { HmacWebhookSignatureVerifier } from './infrastructure/external/HmacWebhookSignatureVerifier';
import { SystemClock } from './infrastructure/external/SystemClock';
import { DrizzleChatsRepository } from './infrastructure/persistence/DrizzleChatsRepository';
import { DrizzleInboxUnitOfWork } from './infrastructure/persistence/DrizzleInboxUnitOfWork';
import { DrizzleWebhookEventRepository } from './infrastructure/persistence/DrizzleWebhookEventRepository';
import { SabaClientesCandidatosAdapter } from './infrastructure/sabaClientes/SabaClientesCandidatosAdapter';
import { ChatsController } from './infrastructure/web/ChatsController';
import { MediaController } from './infrastructure/web/MediaController';
import { WhatsAppWebhookController } from './infrastructure/web/WhatsAppWebhookController';
import { loadWhatsAppConfig } from './infrastructure/whatsappConfig';
import { WHATSAPP_TOKENS } from './tokens';

@Module({
  imports: [SabaClientesModule],
  controllers: [WhatsAppWebhookController, ChatsController, MediaController],
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
    {
      provide: WHATSAPP_TOKENS.ChatsRepository,
      useClass: DrizzleChatsRepository,
    },
    {
      provide: WHATSAPP_TOKENS.WhatsAppCloud,
      useClass: GraphWhatsAppCloudAdapter,
    },
    { provide: WHATSAPP_TOKENS.Clock, useClass: SystemClock },
    ListarConversacionesUseCase,
    {
      provide: WHATSAPP_TOKENS.ListarConversaciones,
      useExisting: ListarConversacionesUseCase,
    },
    ListarMensajesUseCase,
    {
      provide: WHATSAPP_TOKENS.ListarMensajes,
      useExisting: ListarMensajesUseCase,
    },
    ResponderConversacionUseCase,
    {
      provide: WHATSAPP_TOKENS.ResponderConversacion,
      useExisting: ResponderConversacionUseCase,
    },
    ObtenerMediaUseCase,
    { provide: WHATSAPP_TOKENS.ObtenerMedia, useExisting: ObtenerMediaUseCase },
    MarcarLeidaUseCase,
    { provide: WHATSAPP_TOKENS.MarcarLeida, useExisting: MarcarLeidaUseCase },
    ReprocesadorWebhookService,
  ],
})
export class WhatsAppModule {}
