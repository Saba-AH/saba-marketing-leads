import type { WebhookChange } from '../../../domain/WebhookChange';

export interface WebhookEventRepositoryPort {
  /** Saves the unprocessed changes and returns their ids, in the same order. */
  save(changes: WebhookChange[]): Promise<string[]>;
  /** Adds an attempt and records the reason, outside the transaction that failed. */
  registerFailure(eventId: string, error: string): Promise<void>;
  /** Unprocessed ids with fewer than `maxAttempts`, oldest first. */
  pending(maxAttempts: number, limit: number): Promise<string[]>;
}
