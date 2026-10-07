import type { WebhookCambio } from '../../../domain/WebhookCambio';

export interface WebhookEventRepositoryPort {
  /** Guarda los cambios sin procesar y devuelve sus ids, en el mismo orden. */
  guardar(cambios: WebhookCambio[]): Promise<string[]>;
  /** Suma un intento y deja el motivo, fuera de la transacción que falló. */
  registrarFallo(eventoId: string, error: string): Promise<void>;
  /** Ids sin procesar con menos de `maxIntentos`, los más viejos primero. */
  pendientes(maxIntentos: number, limite: number): Promise<string[]>;
}
