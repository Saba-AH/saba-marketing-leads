import { Inject, Injectable } from '@nestjs/common';
import { HealthReport } from '../../domain/HealthReport';
import { HEALTH_TOKENS } from '../../tokens';
import type { CheckHealthPort } from '../ports/in/CheckHealthPort';
import type { Clock } from '../ports/out/Clock';
import type { DependencyProbe } from '../ports/out/DependencyProbe';

@Injectable()
export class CheckHealthUseCase implements CheckHealthPort {
  constructor(
    @Inject(HEALTH_TOKENS.DependencyProbes)
    private readonly probes: readonly DependencyProbe[],
    @Inject(HEALTH_TOKENS.Clock)
    private readonly clock: Clock
  ) {}

  async execute(): Promise<HealthReport> {
    // A dependency that is down must not prevent checking the others: the report
    // is for knowing *what* failed, not just that something failed.
    const checks = await Promise.all(this.probes.map((probe) => probe.check()));

    return HealthReport.from({
      checks,
      uptimeSeconds: Math.floor(this.clock.uptimeSeconds()),
      version: process.env.APP_VERSION ?? '0.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      now: this.clock.now(),
    });
  }
}
