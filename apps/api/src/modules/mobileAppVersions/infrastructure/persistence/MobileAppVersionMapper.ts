import type { MobileAppVersion } from '../../domain/MobileAppVersion';
import type { mobileAppVersions } from './mobileAppVersions.schema';

type MobileAppVersionRow = typeof mobileAppVersions.$inferSelect;

export function toMobileAppVersionDomain(
  row: MobileAppVersionRow
): MobileAppVersion {
  return {
    id: row.id,
    platform: row.platform,
    latestVersion: row.latestVersion,
    minSupportedVersion: row.minSupportedVersion,
    storeUrl: row.storeUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}
