import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { MobileAppVersionRepositoryPort } from '../../application/ports/out/MobileAppVersionRepositoryPort';
import type {
  FiltroMobileAppVersions,
  MobileAppVersion,
} from '../../domain/MobileAppVersion';
import { toMobileAppVersionDomain } from './MobileAppVersionMapper';
import { mobileAppVersions } from './mobileAppVersions.schema';

@Injectable()
export class DrizzleMobileAppVersionRepository
  implements MobileAppVersionRepositoryPort
{
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  /** Las más recientes primero: la primera activa es la vigente. */
  async findAll(filtro: FiltroMobileAppVersions): Promise<MobileAppVersion[]> {
    const filas = await this.db.query.mobileAppVersions.findMany({
      where: filtro.platform
        ? eq(mobileAppVersions.platform, filtro.platform)
        : undefined,
      orderBy: desc(mobileAppVersions.createdAt),
    });
    return filas.map(toMobileAppVersionDomain);
  }
}
