import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { MobileAppVersionRepositoryPort } from '../../application/ports/out/MobileAppVersionRepositoryPort';
import type {
  MobileAppVersion,
  MobileAppVersionsFilter,
} from '../../domain/MobileAppVersion';
import { toMobileAppVersionDomain } from './MobileAppVersionMapper';
import { mobileAppVersions } from './mobileAppVersions.schema';

@Injectable()
export class DrizzleMobileAppVersionRepository
  implements MobileAppVersionRepositoryPort
{
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  /** Most recent first: the first active one is the current one. */
  async findAll(filter: MobileAppVersionsFilter): Promise<MobileAppVersion[]> {
    const rows = await this.db.query.mobileAppVersions.findMany({
      where: filter.platform
        ? eq(mobileAppVersions.platform, filter.platform)
        : undefined,
      orderBy: desc(mobileAppVersions.createdAt),
    });
    return rows.map(toMobileAppVersionDomain);
  }
}
