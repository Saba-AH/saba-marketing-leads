import { Module } from '@nestjs/common';
import { BusModule } from './bus.module';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { ErrorsModule } from './infrastructure/errors/ErrorsModule';
import { LoggingModule } from './infrastructure/logging/LoggingModule';
import { HealthModule } from './modules/health/module';
import { LeadsModule } from './modules/leads/module';
import { MobileAppVersionsModule } from './modules/mobileAppVersions/module';
import { SecurityModule } from './security.module';

@Module({
  imports: [
    LoggingModule,
    ErrorsModule,
    DrizzleModule,
    BusModule,
    SecurityModule,
    LeadsModule,
    MobileAppVersionsModule,
    HealthModule,
  ],
  controllers: [],
})
export class AppModule {}
