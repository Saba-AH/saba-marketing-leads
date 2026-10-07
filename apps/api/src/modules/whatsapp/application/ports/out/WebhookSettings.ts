export interface WebhookSettings {
  /** `null` si `WHATSAPP_VERIFY_TOKEN` no está definido: se rechaza toda suscripción. */
  verifyToken: string | null;
}
