export interface WebhookSubscriptionRequest {
  mode: string | undefined;
  verifyToken: string | undefined;
  challenge: string | undefined;
}

export interface VerifyWebhookSubscriptionPort {
  /** Returns the `challenge` Meta expects back. */
  execute(application: WebhookSubscriptionRequest): string;
}
