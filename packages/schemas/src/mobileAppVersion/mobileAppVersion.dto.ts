import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/** Mismo dominio que el CHECK `mobile_app_versions_platform_check`. */
export const mobilePlatforms = ['ios', 'android'] as const;
export const mobilePlatformSchema = z.enum(mobilePlatforms);
export type TMobilePlatform = z.infer<typeof mobilePlatformSchema>;

/** Versión publicada de la app móvil en una tienda. */
export const mobileAppVersionSchema = z.object({
  id: z.string(),
  platform: mobilePlatformSchema,
  latestVersion: z.string(),
  /** Por debajo de esta versión la app debe forzar la actualización. */
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

/** Query de `GET /mobile-app-versions`. */
export const listarMobileAppVersionsQuerySchema = z.object({
  platform: mobilePlatformSchema.optional(),
});
export type TListarMobileAppVersionsQuery = z.infer<
  typeof listarMobileAppVersionsQuerySchema
>;
