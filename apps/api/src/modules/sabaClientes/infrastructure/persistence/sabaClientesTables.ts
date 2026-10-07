import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Columnas de `profiles` y `applications` de Saba que usa este módulo. No se
 * llama `*.schema.ts` a propósito: estas tablas no se migran desde acá.
 */

export const sabaProfiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  telefono: text('telefono'),
  cedula: text('cedula'),
});

export const sabaApplications = pgTable('applications', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
