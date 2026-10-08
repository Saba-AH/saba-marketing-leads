import {
  boolean,
  integer,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Tables this repo does not create in Supabase: `profiles`, `login_attempts`
 * and `admin_login_lockouts` belong to Saba, and `auth.sessions` to GoTrue.
 * Only the columns the login uses.
 *
 * The file is not named `*.schema.ts` on purpose: `drizzle.config.ts` picks
 * those up to generate migrations, and these tables are not migrated from here.
 */

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('nombre').notNull(),
  lastName: text('apellido').notNull(),
  role: text('role'),
});

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  portal: text('portal').notNull(),
  email: text('email'),
  userId: uuid('user_id'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminLoginLockouts = pgTable('admin_login_lockouts', {
  userId: uuid('user_id').primaryKey(),
  email: text('email'),
  failedCount: integer('failed_count').notNull().default(0),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const authSchema = pgSchema('auth');

export const authSessions = authSchema.table('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  notAfter: timestamp('not_after', { withTimezone: true }),
});
