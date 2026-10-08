import type {
  MobileAppVersion,
  MobileAppVersionsFilter,
} from '../../../domain/MobileAppVersion';

export interface ListMobileAppVersionsPort {
  execute(filter: MobileAppVersionsFilter): Promise<MobileAppVersion[]>;
}
