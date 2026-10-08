import type {
  MobileAppVersion,
  MobileAppVersionsFilter,
} from '../../../domain/MobileAppVersion';

export interface MobileAppVersionRepositoryPort {
  findAll(filter: MobileAppVersionsFilter): Promise<MobileAppVersion[]>;
}
