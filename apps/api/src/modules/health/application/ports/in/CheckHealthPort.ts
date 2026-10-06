import type { HealthReport } from '../../../domain/HealthReport';

/** Puerto de entrada: comprobar la salud de la API y sus dependencias. */
export interface CheckHealthPort {
  execute(): Promise<HealthReport>;
}
