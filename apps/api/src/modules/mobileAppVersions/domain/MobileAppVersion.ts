export type MobilePlatform = 'ios' | 'android';

/** Published version of the mobile app. See `@repo/schemas` for the contract. */
export interface MobileAppVersion {
  id: string;
  platform: MobilePlatform;
  latestVersion: string;
  minSupportedVersion: string | null;
  storeUrl: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MobileAppVersionsFilter {
  platform?: MobilePlatform;
}
