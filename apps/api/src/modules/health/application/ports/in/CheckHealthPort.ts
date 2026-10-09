import type { HealthReport } from '../../../domain/HealthReport';

/** Inbound port: check the health of the API and its dependencies. */
export interface CheckHealthPort {
  execute(): Promise<HealthReport>;
}
