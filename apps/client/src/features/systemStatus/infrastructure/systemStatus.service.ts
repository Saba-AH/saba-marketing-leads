import type { SystemStatus } from '../domain/systemStatus.model';
import type { HealthApi } from './systemStatus.interfaces';
import { toSystemStatusDomain } from './systemStatus.transform';

export class SystemStatusServiceClass {
  constructor(private healthApi: HealthApi) {}

  async getStatus(): Promise<SystemStatus> {
    const result = await this.healthApi.check();
    if (!result.success) {
      throw new Error(result.error);
    }
    return toSystemStatusDomain(result.data);
  }
}
