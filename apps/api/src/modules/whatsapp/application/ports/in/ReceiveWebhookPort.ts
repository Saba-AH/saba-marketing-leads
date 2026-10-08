export interface IncomingWebhook {
  /** Exact bytes that arrived: the signature is computed over them, not over the parsed JSON. */
  rawBody: Buffer | undefined;
  signature: string | undefined;
  body: unknown;
}

export interface ReceiveWebhookPort {
  /** Returns how many changes were saved. */
  execute(webhook: IncomingWebhook): Promise<number>;
}
