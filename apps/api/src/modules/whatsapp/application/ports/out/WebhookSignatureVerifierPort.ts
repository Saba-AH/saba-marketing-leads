export interface WebhookSignatureVerifierPort {
  isValid(rawBody: Buffer | undefined, signature: string | undefined): boolean;
}
