export type MobilePlatform = 'ios' | 'android';

/** Versión publicada de la app móvil. Ver `@repo/schemas` para el contrato. */
export interface MobileAppVersion {
  id: string;
  platform: MobilePlatform;
  latestVersion: string;
  minSupportedVersion: string | null;
  storeUrl: string;
  isActive: boolean;
  createdAt: Date;
}

export interface FiltroMobileAppVersions {
  platform?: MobilePlatform;
}
