import { Module } from '@nestjs/common';
import { ListMobileAppVersionsUseCase } from './application/use-cases/ListMobileAppVersionsUseCase';
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
    ListMobileAppVersionsUseCase,
    {
      provide: MOBILE_APP_VERSIONS_TOKENS.ListMobileAppVersions,
      useExisting: ListMobileAppVersionsUseCase,
    },
  ],
})
export class MobileAppVersionsModule {}
