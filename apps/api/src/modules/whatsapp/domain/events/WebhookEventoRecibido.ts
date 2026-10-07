/** Un cambio del webhook quedó guardado en `whatsapp_webhook_events` y espera procesarse. */
export class WebhookEventoRecibido {
  constructor(readonly eventoId: string) {}
}
