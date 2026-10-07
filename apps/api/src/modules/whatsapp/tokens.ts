export const WHATSAPP_TOKENS = {
  Config: Symbol('WhatsAppConfig'),
  WebhookSettings: Symbol('WebhookSettings'),
  WebhookSignatureVerifier: Symbol('WebhookSignatureVerifierPort'),
  WebhookEventRepository: Symbol('WebhookEventRepositoryPort'),
  WebhookEventPublisher: Symbol('WebhookEventPublisherPort'),
  VerificarSuscripcionWebhook: Symbol('VerificarSuscripcionWebhookPort'),
  RecibirWebhook: Symbol('RecibirWebhookPort'),
  InboxUnitOfWork: Symbol('InboxUnitOfWork'),
  ProcesarWebhookEvento: Symbol('ProcesarWebhookEventoPort'),
  ReprocesarPendientes: Symbol('ReprocesarPendientesPort'),
} as const;
