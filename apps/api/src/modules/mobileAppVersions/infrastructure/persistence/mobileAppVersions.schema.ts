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
 * Mirror of `public.mobile_app_versions`, which already existed in Supabase
 * before this repo. The column and CHECK names are that table's: if they
 * diverge, `db:generate` proposes changes Supabase does not need.
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
  (table) => [
    check(
      'mobile_app_versions_platform_check',
      sql`${table.platform} = ANY (ARRAY['ios'::text, 'android'::text])`
    ),
  ]
);
