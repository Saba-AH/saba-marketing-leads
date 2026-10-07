export interface WebhookSignatureVerifierPort {
  esValida(rawBody: Buffer | undefined, firma: string | undefined): boolean;
}
