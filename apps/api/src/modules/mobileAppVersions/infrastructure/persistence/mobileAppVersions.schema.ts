import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Espejo de `public.mobile_app_versions`, que ya existía en Supabase antes de
 * este repo. Los nombres de columnas y del CHECK son los de esa tabla: si
 * divergen, `db:generate` propone cambios que Supabase no necesita.
 */
export const mobileAppVersions = pgTable(
  'mobile_app_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
    latestVersion: text('latest_version').notNull(),
    minSupportedVersion: text('min_supported_version'),
    storeUrl: text('store_url').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    check(
      'mobile_app_versions_platform_check',
      sql`${tabla.platform} = ANY (ARRAY['ios'::text, 'android'::text])`
    ),
  ]
);
