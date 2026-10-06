import { Module } from '@nestjs/common';
import type { DependencyProbe } from './application/ports/out/DependencyProbe';
import { CheckHealthUseCase } from './application/use-cases/CheckHealthUseCase';
import { PostgresProbe } from './infrastructure/persistence/PostgresProbe';
import { SystemClock } from './infrastructure/time/SystemClock';
import { HealthController } from './infrastructure/web/HealthController';
import { HEALTH_TOKENS } from './tokens';

@Module({
  controllers: [HealthController],
  providers: [
    PostgresProbe,
    SystemClock,
    {
      provide: HEALTH_TOKENS.Clock,
      useExisting: SystemClock,
    },
    {
      // Cada integración nueva se suma aquí como una sonda más.
      provide: HEALTH_TOKENS.DependencyProbes,
      useFactory: (postgres: PostgresProbe): DependencyProbe[] => [postgres],
      inject: [PostgresProbe],
    },
    CheckHealthUseCase,
    {
      provide: HEALTH_TOKENS.CheckHealth,
      useExisting: CheckHealthUseCase,
    },
  ],
})
export class HealthModule {}
