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
 * Tablas que este repo no crea en Supabase: `profiles`, `login_attempts` y
 * `admin_login_lockouts` son de Saba, y `auth.sessions` de GoTrue. Solo las
 * columnas que usa el login.
 *
 * El archivo no se llama `*.schema.ts` a propósito: `drizzle.config.ts` toma
 * esos para generar migraciones, y estas tablas no se migran desde acá.
 */

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
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
