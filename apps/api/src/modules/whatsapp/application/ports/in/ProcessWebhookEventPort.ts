/** `skipped`: it was already processed or another instance is processing it. */
export type ProcessingResult = 'processed' | 'skipped' | 'failed';

export interface ProcessWebhookEventPort {
  execute(eventId: string): Promise<ProcessingResult>;
}
