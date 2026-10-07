import type { WebhookCambio } from '../../../domain/WebhookCambio';

export interface WebhookEventRepositoryPort {
  /** Guarda los cambios sin procesar y devuelve sus ids, en el mismo orden. */
  guardar(cambios: WebhookCambio[]): Promise<string[]>;
}
