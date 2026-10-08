import { Inject, Injectable } from '@nestjs/common';
import type {
  MobileAppVersion,
  MobileAppVersionsFilter,
} from '../../domain/MobileAppVersion';
import { MOBILE_APP_VERSIONS_TOKENS } from '../../tokens';
import type { ListMobileAppVersionsPort } from '../ports/in/ListMobileAppVersionsPort';
import type { MobileAppVersionRepositoryPort } from '../ports/out/MobileAppVersionRepositoryPort';

@Injectable()
export class ListMobileAppVersionsUseCase implements ListMobileAppVersionsPort {
  constructor(
    @Inject(MOBILE_APP_VERSIONS_TOKENS.MobileAppVersionRepository)
    private readonly versions: MobileAppVersionRepositoryPort
  ) {}

  async execute(filter: MobileAppVersionsFilter): Promise<MobileAppVersion[]> {
    return await this.versions.findAll(filter);
  }
}
