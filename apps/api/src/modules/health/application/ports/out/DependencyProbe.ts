import type { DependencyCheck } from '../../../domain/HealthReport';

/**
 * Puerto de salida: una dependencia que sabe reportar si está viva.
 *
 * Cada integración (Postgres, Cloud Storage, Vertex AI, ...) implementa este
 * puerto en su adaptador; el caso de uso solo conoce la interfaz.
 */
export interface DependencyProbe {
  readonly name: string;
  check(): Promise<DependencyCheck>;
}
