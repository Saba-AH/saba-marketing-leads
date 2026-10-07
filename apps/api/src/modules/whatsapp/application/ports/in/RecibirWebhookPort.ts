export interface WebhookEntrante {
  /** Bytes exactos que llegaron: la firma se calcula sobre ellos, no sobre el JSON parseado. */
  rawBody: Buffer | undefined;
  firma: string | undefined;
  cuerpo: unknown;
}

export interface RecibirWebhookPort {
  /** Devuelve cuántos cambios quedaron guardados. */
  execute(webhook: WebhookEntrante): Promise<number>;
}
