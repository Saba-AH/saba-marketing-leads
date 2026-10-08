export interface WebhookSettings {
  /** `null` if `WHATSAPP_VERIFY_TOKEN` is not defined: every subscription is rejected. */
  verifyToken: string | null;
}
