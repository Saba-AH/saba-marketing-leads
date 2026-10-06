import type {
  FiltroMobileAppVersions,
  MobileAppVersion,
} from '../../../domain/MobileAppVersion';

export interface MobileAppVersionRepositoryPort {
  findAll(filtro: FiltroMobileAppVersions): Promise<MobileAppVersion[]>;
}
