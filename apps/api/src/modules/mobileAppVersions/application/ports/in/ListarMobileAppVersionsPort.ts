import type {
  FiltroMobileAppVersions,
  MobileAppVersion,
} from '../../../domain/MobileAppVersion';

export interface ListarMobileAppVersionsPort {
  execute(filtro: FiltroMobileAppVersions): Promise<MobileAppVersion[]>;
}
