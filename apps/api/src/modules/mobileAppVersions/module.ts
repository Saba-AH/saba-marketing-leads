import { Module } from '@nestjs/common';
import { ListarMobileAppVersionsUseCase } from './application/use-cases/ListarMobileAppVersionsUseCase';
import { DrizzleMobileAppVersionRepository } from './infrastructure/persistence/DrizzleMobileAppVersionRepository';
import { MobileAppVersionsController } from './infrastructure/web/MobileAppVersionsController';
import { MOBILE_APP_VERSIONS_TOKENS } from './tokens';

@Module({
  controllers: [MobileAppVersionsController],
  providers: [
    DrizzleMobileAppVersionRepository,
    {
      provide: MOBILE_APP_VERSIONS_TOKENS.MobileAppVersionRepository,
      useExisting: DrizzleMobileAppVersionRepository,
    },
    ListarMobileAppVersionsUseCase,
    {
      provide: MOBILE_APP_VERSIONS_TOKENS.ListarMobileAppVersions,
      useExisting: ListarMobileAppVersionsUseCase,
    },
  ],
})
export class MobileAppVersionsModule {}
