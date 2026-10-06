import type {
  TMobileAppVersion,
  TMobileAppVersionsResponse,
} from '@repo/schemas';
import type { MobileAppVersion } from '../../domain/MobileAppVersion';

function toMobileAppVersion(version: MobileAppVersion): TMobileAppVersion {
  return {
    id: version.id,
    platform: version.platform,
    latestVersion: version.latestVersion,
    minSupportedVersion: version.minSupportedVersion,
    storeUrl: version.storeUrl,
    isActive: version.isActive,
    createdAt: version.createdAt.toISOString(),
  };
}

export function toMobileAppVersionsResponse(
  versiones: MobileAppVersion[]
): TMobileAppVersionsResponse {
  return { success: true, data: versiones.map(toMobileAppVersion) };
}
