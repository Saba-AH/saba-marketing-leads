/** A webhook change was saved in `whatsapp_webhook_events` and is waiting to be processed. */
export class WebhookEventReceived {
  constructor(readonly eventId: string) {}
}
