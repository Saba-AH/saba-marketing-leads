import type { DependencyCheck } from '../../../domain/HealthReport';

/**
 * Outbound port: a dependency that can report whether it is alive.
 *
 * Each integration (Postgres, Cloud Storage, Vertex AI, ...) implements this
 * port in its adapter; the use case only knows the interface.
 */
export interface DependencyProbe {
  readonly name: string;
  check(): Promise<DependencyCheck>;
}
