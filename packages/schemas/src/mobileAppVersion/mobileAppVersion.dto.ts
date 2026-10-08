import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/** Same domain as the `mobile_app_versions_platform_check` CHECK. */
export const mobilePlatforms = ['ios', 'android'] as const;
export const mobilePlatformSchema = z.enum(mobilePlatforms);
export type TMobilePlatform = z.infer<typeof mobilePlatformSchema>;

/** Mobile app version published in a store. */
export const mobileAppVersionSchema = z.object({
  id: z.string(),
  platform: mobilePlatformSchema,
  latestVersion: z.string(),
  /** Below this version the app must force an update. */
  minSupportedVersion: z.string().nullable(),
  storeUrl: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type TMobileAppVersion = z.infer<typeof mobileAppVersionSchema>;

export const mobileAppVersionsResponseSchema = buildSafeResponseSchema(
  z.array(mobileAppVersionSchema)
);
export type TMobileAppVersionsResponse = z.infer<
  typeof mobileAppVersionsResponseSchema
>;

/** Query of `GET /mobile-app-versions`. */
export const listMobileAppVersionsQuerySchema = z.object({
  platform: mobilePlatformSchema.optional(),
});
export type TListMobileAppVersionsQuery = z.infer<
  typeof listMobileAppVersionsQuerySchema
>;
