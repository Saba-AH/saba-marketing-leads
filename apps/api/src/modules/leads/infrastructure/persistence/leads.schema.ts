import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  nombre: text('nombre').notNull(),
  correo: text('correo').notNull().unique(),
  origen: text('origen'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
