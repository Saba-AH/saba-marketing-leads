export interface WebhookEventPublisherPort {
  /**
   * Signals there are events to process. It does not throw: if the signal is
   * lost, the event is already saved and the periodic sweep picks it up.
   */
  publishReceived(eventIds: string[]): void;
}
